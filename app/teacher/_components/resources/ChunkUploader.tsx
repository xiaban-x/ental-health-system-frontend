'use client';

import { useState, useRef } from 'react';
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
}

export default function ChunkUploader({ onFileSelect, onUploadComplete }: ChunkUploaderProps) {
    const [uploadState, setUploadState] = useState<ChunkUploadState | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // 准备分片上传
    const prepareChunkUpload = (file: File) => {
        const chunkSize = 1024 * 1024 * 5; // 5MB
        const totalChunks = Math.ceil(file.size / chunkSize);
        const identifier = `${file.name}-${file.size}-${new Date().getTime()}`;
        
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
        
        return { identifier, totalChunks, chunkSize };
    };
    
    // 上传单个分片
    const uploadChunk = async (chunk: Blob, chunkNumber: number, identifier: string, filename: string, totalChunks: number) => {
        const formData = new FormData();
        formData.append('file', chunk, `${identifier}-${chunkNumber}`);
        formData.append('chunkNumber', chunkNumber.toString());
        formData.append('chunkSize', chunk.size.toString());
        formData.append('currentChunkSize', chunk.size.toString());
        formData.append('totalSize', uploadState?.totalSize.toString() || '0');
        formData.append('identifier', identifier);
        formData.append('filename', filename);
        formData.append('totalChunks', totalChunks.toString());
        formData.append('fileType', uploadState?.file.type || '');
        
        try {
            // 先检查分片是否存在
            const checkResponse = await apiClient.post('/minio/chunk/check', formData);
            
            if (checkResponse.code === 0 && checkResponse.data && checkResponse.data.exists) {
                // 分片已存在，标记为已上传
                setUploadState(prev => {
                    if (!prev) return null;
                    const newUploadedChunks = new Set(prev.uploadedChunks);
                    newUploadedChunks.add(chunkNumber);
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
                setUploadState(prev => {
                    if (!prev) return null;
                    const newUploadedChunks = new Set(prev.uploadedChunks);
                    newUploadedChunks.add(chunkNumber);
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
    const mergeChunks = async (identifier: string, filename: string, totalChunks: number) => {
        try {
            const response = await apiClient.post('/minio/chunk/merge', {
                identifier,
                filename,
                totalChunks
            });
            
            if (response.code === 0) {
                setUploadState(prev => prev ? { ...prev, status: 'completed' } : null);
                return response.data.url;
            } else {
                throw new Error(response.msg || '合并分片失败');
            }
        } catch (error) {
            console.error('合并分片错误:', error);
            setUploadState(prev => prev ? { ...prev, status: 'error' } : null);
            throw error;
        }
    };
    
    // 开始分片上传
    const startChunkUpload = async (file: File) => {
        if (isUploading) return;
        
        setIsUploading(true);
        try {
            onFileSelect(file);
            const { identifier, totalChunks, chunkSize } = prepareChunkUpload(file);
            setUploadState(prev => prev ? { ...prev, status: 'uploading' } : null);
            
            // 并发上传分片，最多5个并发
            const concurrency = 5;
            let currentChunk = 1;
            
            const uploadNextChunk = async () => {
                if (currentChunk > totalChunks) return;
                
                const chunkNumber = currentChunk++;
                const start = (chunkNumber - 1) * chunkSize;
                const end = Math.min(start + chunkSize, file.size);
                const chunk = file.slice(start, end);
                
                await uploadChunk(chunk, chunkNumber, identifier, file.name, totalChunks);
                
                // 检查是否所有分片都已上传
                if (uploadState && uploadState.uploadedChunks.size === totalChunks) {
                    const fileUrl = await mergeChunks(identifier, file.name, totalChunks);
                    onUploadComplete(fileUrl);
                    return;
                }
                
                await uploadNextChunk();
            };
            
            // 启动并发上传
            const uploadPromises = [];
            for (let i = 0; i < concurrency; i++) {
                uploadPromises.push(uploadNextChunk());
            }
            
            await Promise.all(uploadPromises);
        } catch (error) {
            console.error('上传视频错误:', error);
            toast.error('视频上传失败', {
                description: '服务器错误，请稍后再试',
            });
            setUploadState(prev => prev ? { ...prev, status: 'error' } : null);
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
            {!uploadState ? (
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground mb-4">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <p className="mb-2 text-sm font-medium">点击或拖拽上传视频</p>
                    <p className="text-xs text-muted-foreground mb-4">支持 MP4, MOV, AVI 等格式</p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="video-upload"
                    />
                    <Button 
                        variant="outline" 
                        onClick={() => fileInputRef.current?.click()}
                    >
                        选择视频文件
                    </Button>
                </div>
            ) : (
                <div className="p-4 border rounded-md">
                    <div className="flex justify-between items-center mb-2">
                        <p className="font-medium">{uploadState.filename}</p>
                        <p className="text-sm text-muted-foreground">
                            {Math.round(uploadState.progress)}%
                        </p>
                    </div>
                    
                    <Progress value={uploadState.progress} className="mb-4" />
                    
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                            {uploadState.uploadedChunks.size} / {uploadState.totalChunks} 分片
                            ({(uploadState.totalSize / (1024 * 1024)).toFixed(2)} MB)
                        </div>
                        
                        <div className="flex space-x-2">
                            {uploadState.status === 'uploading' ? (
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={handlePauseUpload}
                                    disabled={uploadState.progress === 100}
                                >
                                    暂停
                                </Button>
                            ) : uploadState.status === 'paused' ? (
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={handleResumeUpload}
                                >
                                    继续
                                </Button>
                            ) : null}
                            
                            {uploadState.status !== 'completed' && (
                                <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={handleCancelUpload}
                                >
                                    取消
                                </Button>
                            )}
                        </div>
                    </div>
                    
                    {uploadState.status === 'error' && (
                        <div className="mt-2 text-sm text-destructive">
                            上传出错，请重试或选择其他文件
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}