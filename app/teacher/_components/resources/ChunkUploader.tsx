'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/app/_components/ui/button';
import { Progress } from '@/app/_components/ui/progress';
import { apiClient } from '@/app/_lib/api-client';
import { toast } from 'sonner';

// 分片上传状态
interface ChunkUploadState {
    identifier: string;
    filename: string;
    totalChunks: number;
    chunkSize: number;
    totalSize: number;
    uploadedChunks: Set<number>;
    status: 'preparing' | 'uploading' | 'paused' | 'completed' | 'error';
    progress: number;
    file: File;
}

interface ChunkUploaderProps {
    onFileSelect: (file: File) => void;
    onUploadComplete: (url: string) => void;
    onUploadError?: () => void;
    initialFile?: File | null;
}

export default function ChunkUploader({ onFileSelect, onUploadComplete, onUploadError, initialFile }: ChunkUploaderProps) {
    const [uploadState, setUploadState] = useState<ChunkUploadState | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadedChunksRef = useRef(new Set<number>());
    
    // 使用useEffect处理initialFile
    useEffect(() => {
        if (initialFile && !isUploading && !uploadState) {
            startChunkUpload(initialFile);
        }
    }, [initialFile]);
    
    // 添加useEffect来监听状态变化
    useEffect(() => {
        console.log("uploadState ===>", uploadState);
        console.log("isUploading ===>", isUploading);
    }, [uploadState, isUploading]);

    // 生成相对路径，按年月和类型分类
    const generateRelativePath = (fileType: string) => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');

        // 根据文件类型确定文件夹
        const typeFolder = fileType.startsWith('video/') ? 'video' :
            fileType.startsWith('audio/') ? 'audio' :
                fileType.startsWith('image/') ? 'image' : 'other';

        return `${year}/${month}/${typeFolder}`;
    };

    // 准备分片上传
    const prepareChunkUpload = (file: File) => {
        const chunkSize = 1024 * 1024 * 5; // 5MB
        const totalChunks = Math.ceil(file.size / chunkSize);
        const identifier = `${file.name}-${file.size}`;
        const relativePath = generateRelativePath(file.type);

        setUploadState({
            identifier,
            filename: file.name,
            totalChunks,
            chunkSize,
            totalSize: file.size,
            uploadedChunks: new Set(),
            status: 'preparing',
            progress: 0,
            file
        });

        return { identifier, totalChunks, chunkSize, relativePath };
    };

    // 上传单个分片
    const uploadChunk = async (chunk: Blob, chunkNumber: number, identifier: string, file: File, totalChunks: number, relativePath: string) => {
        const formData = new FormData();
        formData.append('file', chunk, `${identifier}-${chunkNumber}`);
        formData.append('chunkNumber', chunkNumber.toString());
        formData.append('chunkSize', chunk.size.toString());
        formData.append('totalSize', file.size.toString());
        formData.append('identifier', identifier);
        formData.append('filename', file.name);
        formData.append('totalChunks', totalChunks.toString());
        formData.append('fileType', file.type);
        formData.append('relativePath', relativePath);

        try {
            // 先检查分片是否存在
            const checkResponse = await apiClient.post<{ exist: boolean }>('/minio/chunk/check', formData);
            const chunkExists = checkResponse.code === 0 && checkResponse.data && checkResponse.data.exist;

            if (chunkExists) {
                console.log(`分片 ${chunkNumber} 已存在，跳过上传`);
                // 更新本地ref
                uploadedChunksRef.current.add(chunkNumber);
                // 更新React状态
                setUploadState(prev => {
                    if (!prev) return null;
                    const newUploadedChunks = new Set([...prev.uploadedChunks, chunkNumber]);
                    const progress = Math.round((newUploadedChunks.size / prev.totalChunks) * 100);
                    return {
                        ...prev,
                        uploadedChunks: newUploadedChunks,
                        progress
                    };
                });
                return true;
            }

            // 上传分片
            const uploadResponse = await apiClient.post('/minio/chunk/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            if (uploadResponse.code === 0) {
                // 更新本地ref
                uploadedChunksRef.current.add(chunkNumber);
                // 更新React状态
                setUploadState(prev => {
                    if (!prev) return null;
                    const newUploadedChunks = new Set([...prev.uploadedChunks, chunkNumber]);
                    const progress = Math.round((newUploadedChunks.size / prev.totalChunks) * 100);
                    return {
                        ...prev,
                        uploadedChunks: newUploadedChunks,
                        progress
                    };
                });
                return true;
            } else {
                throw new Error(uploadResponse.msg || '上传分片失败');
            }
        } catch (error) {
            console.error(`上传分片 ${chunkNumber} 失败:`, error);
            return false;
        }
    };

    // 合并分片
    const mergeChunks = async (identifier: string, filename: string, totalChunks: number, relativePath: string) => {
        try {
            const response = await apiClient.post<{ url: string; filename: string }>('/minio/chunk/merge', {
                identifier,
                filename,
                totalChunks,
                relativePath
            });
            if (response.code === 0) {
                setUploadState(prev => prev ? { ...prev, status: 'completed' } : null);
                return response.data!.url;
            } else {
                throw new Error(response.msg || '合并分片失败');
            }
        } catch (error) {
            console.error('合并分片错误:', error);
            setUploadState(prev => prev ? { ...prev, status: 'error' } : null);
            // 调用错误回调
            if (onUploadError) onUploadError();
            throw error;
        }
    };

    // 开始分片上传
    const startChunkUpload = async (file: File) => {
        if (isUploading) return;

        // 重置上传状态
        uploadedChunksRef.current = new Set<number>();
        setIsUploading(true);
        
        try {
            onFileSelect(file);
            
            // 设置初始状态
            const chunkSize = 1024 * 1024 * 5; // 5MB
            const totalChunks = Math.ceil(file.size / chunkSize);
            const identifier = `${file.name}-${file.size}`;
            const relativePath = generateRelativePath(file.type);
            
            // 立即设置状态
            setUploadState({
                identifier,
                filename: file.name,
                totalChunks,
                chunkSize,
                totalSize: file.size,
                uploadedChunks: new Set(),
                status: 'uploading',
                progress: 0,
                file
            });
            
            // 并发上传分片，最多5个并发
            const concurrency = 5;
            let currentChunk = 1;

            const uploadNextChunk = async () => {
                if (currentChunk > totalChunks) return;

                const chunkNumber = currentChunk++;
                const start = (chunkNumber - 1) * chunkSize;
                const end = Math.min(start + chunkSize, file.size);
                const chunk = file.slice(start, end);

                const success = await uploadChunk(chunk, chunkNumber, identifier, file, totalChunks, relativePath);
                
                // 使用ref检查是否所有分片都已上传
                if (uploadedChunksRef.current.size === totalChunks) {
                    try {
                        const fileUrl = await mergeChunks(identifier, file.name, totalChunks, relativePath);
                        setUploadState(prev => prev ? { ...prev, status: 'completed' } : null);
                        onUploadComplete(fileUrl);
                    } catch (error) {
                        console.error('合并分片错误:', error);
                        setUploadState(prev => prev ? { ...prev, status: 'error' } : null);
                    }
                    return;
                }

                await uploadNextChunk();
            };

            // 启动并发上传
            const uploadPromises = [];
            for (let i = 0; i < concurrency && i < totalChunks; i++) {
                uploadPromises.push(uploadNextChunk());
            }

            await Promise.all(uploadPromises);
        } catch (error) {
            console.error('上传视频错误:', error);
            toast.error('视频上传失败', {
                description: '服务器错误，请稍后再试',
            });
            setUploadState(prev => prev ? { ...prev, status: 'error' } : null);
            // 调用错误回调
            if (onUploadError) onUploadError();
        } finally {
            setIsUploading(false);
        }
    };

    // 处理文件选择
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 检查文件类型
        if (!file.type.startsWith('video/')) {
            toast.error('请选择视频文件');
            return;
        }
        // prepareChunkUpload(file);
        // 开始上传
        startChunkUpload(file);
    };

    // 暂停上传
    const handlePauseUpload = () => {
        setUploadState(prev => prev ? { ...prev, status: 'paused' } : null);
        toast.info('上传已暂停，您可以稍后继续');
    };

    // 继续上传
    const handleResumeUpload = () => {
        if (!uploadState || !uploadState.file) return;

        setUploadState(prev => prev ? { ...prev, status: 'uploading' } : null);
        startChunkUpload(uploadState.file);
    };

    // 取消上传
    const handleCancelUpload = () => {
        setUploadState(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-4">
            {!initialFile && (
                <div className="flex items-center justify-center w-full">
                    <label
                        htmlFor="video-upload"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                    >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                            </svg>
                            <p className="mb-2 text-sm text-gray-500">
                                <span className="font-semibold">点击上传</span> 或拖放
                            </p>
                            <p className="text-xs text-gray-500">支持的格式: MP4, WebM, MOV (最大 500MB)</p>
                        </div>
                        <input
                            id="video-upload"
                            type="file"
                            className="hidden"
                            accept="video/*"
                            ref={fileInputRef}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    startChunkUpload(file);
                                }
                            }}
                        />
                    </label>
                </div>
            )}

            {uploadState && (
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>上传进度: {uploadState.progress}%</span>
                        <span>{Math.round((uploadState.progress / 100) * uploadState.totalSize / (1024 * 1024))} / {Math.round(uploadState.totalSize / (1024 * 1024))} MB</span>
                    </div>
                    <Progress value={uploadState.progress} className="h-2" />
                    <p className="text-xs text-gray-500">
                        {uploadState.status === 'uploading' && '正在上传...'}
                        {uploadState.status === 'completed' && '上传完成'}
                        {uploadState.status === 'error' && '上传失败'}
                    </p>
                </div>
            )}
        </div>
    );
}