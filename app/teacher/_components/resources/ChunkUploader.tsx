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
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadedChunksRef = useRef(new Set<number>());
    const isPausedRef = useRef(false);
    const isCancelledRef = useRef(false);
    const uploadTasksRef = useRef<Array<() => Promise<void>>>([]);
    // 添加一个ref来防止重复上传
    const isUploadingRef = useRef(false);
    // 添加一个ref来防止重复合并
    const isMergingRef = useRef(false);
    // 添加一个ref来跟踪当前上传的文件标识符
    const currentIdentifierRef = useRef<string | null>(null);

    // 修改useEffect，添加防重复逻辑
    useEffect(() => {
        if (initialFile && !isUploadingRef.current && !uploadState) {
            startChunkUpload(initialFile);
        }

        return () => {
            isCancelledRef.current = true;
        };
    }, [initialFile]);

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

    // 上传单个分片
    // 修改上传分片函数，改进暂停逻辑
    const uploadChunk = async (chunk: Blob, chunkNumber: number, identifier: string, file: File, totalChunks: number, relativePath: string) => {
        // 检查是否已取消
        if (isCancelledRef.current) {
            return false;
        }

        // 检查是否已暂停
        if (isPausedRef.current) {
            console.log(`分片 ${chunkNumber} 上传被暂停，添加到队列`);
            return new Promise<boolean>((resolve) => {
                uploadTasksRef.current.push(async () => {
                    try {
                        const result = await uploadChunk(chunk, chunkNumber, identifier, file, totalChunks, relativePath);
                        resolve(result);
                    } catch (error) {
                        console.error(`恢复上传分片 ${chunkNumber} 失败:`, error);
                        resolve(false);
                    }
                });
            });
        }

        // 检查分片是否已上传
        if (uploadedChunksRef.current.has(chunkNumber)) {
            console.log(`分片 ${chunkNumber} 已在本地标记为上传，跳过上传`);
            return true;
        }

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

    // 修改合并分片函数，添加防重复逻辑
    const mergeChunks = async (identifier: string, filename: string, totalChunks: number, relativePath: string) => {
        // 防止重复合并
        if (isMergingRef.current) {
            console.log('已有合并任务正在进行，跳过');
            return '';
        }

        try {
            isMergingRef.current = true;
            console.log('开始合并分片:', identifier);

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
            if (onUploadError) onUploadError();
            throw error;
        } finally {
            isMergingRef.current = false;
        }
    };

    // 修改开始上传函数，添加防重复逻辑
    const startChunkUpload = async (file: File) => {
        // 防止重复上传
        if (isUploadingRef.current) {
            console.log('已有上传任务正在进行，跳过');
            return;
        }

        // 重置上传状态
        uploadedChunksRef.current = new Set<number>();
        isPausedRef.current = false;
        isCancelledRef.current = false;
        uploadTasksRef.current = [];
        isUploadingRef.current = true;
        isMergingRef.current = false;

        try {
            onFileSelect(file);

            // 设置初始状态
            const chunkSize = 1024 * 1024 * 5; // 5MB
            const totalChunks = Math.ceil(file.size / chunkSize);
            const identifier = `${file.name}-${file.size}`;
            currentIdentifierRef.current = identifier;
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

            // 修改并发上传逻辑，使用一个队列来管理分片上传
            let pendingChunks: number[] = [];
            for (let i = 1; i <= totalChunks; i++) {
                pendingChunks.push(i);
            }

            // 创建一个函数来处理单个分片上传
            const processChunk = async (chunkNumber: number) => {
                const start = (chunkNumber - 1) * chunkSize;
                const end = Math.min(start + chunkSize, file.size);
                const chunk = file.slice(start, end);

                await uploadChunk(chunk, chunkNumber, identifier, file, totalChunks, relativePath);

                // 检查是否所有分片都已上传
                if (uploadedChunksRef.current.size === totalChunks && !isMergingRef.current) {
                    try {
                        const fileUrl = await mergeChunks(identifier, file.name, totalChunks, relativePath);
                        setUploadState(prev => prev ? { ...prev, status: 'completed' } : null);
                        onUploadComplete(fileUrl);
                    } catch (error) {
                        console.error('合并分片错误:', error);
                        setUploadState(prev => prev ? { ...prev, status: 'error' } : null);
                        if (onUploadError) onUploadError();
                    }
                }
            };

            // 创建一个函数来管理并发上传
            const uploadManager = async () => {
                const concurrency = 3; // 降低并发数，避免过多请求
                let activeUploads = 0;

                const uploadNextChunk = async () => {
                    if (pendingChunks.length === 0) return;
                    if (isCancelledRef.current) return;
                    if (isPausedRef.current) return;

                    activeUploads++;
                    const chunkNumber = pendingChunks.shift()!;

                    try {
                        await processChunk(chunkNumber);
                    } finally {
                        activeUploads--;

                        // 继续上传下一个分片
                        if (!isPausedRef.current && !isCancelledRef.current) {
                            uploadNextChunk();
                        }

                        // 检查是否所有上传都已完成
                        if (activeUploads === 0 && pendingChunks.length === 0) {
                            console.log('所有分片处理完成');
                        }
                    }
                };

                // 启动初始的并发上传
                for (let i = 0; i < Math.min(concurrency, pendingChunks.length); i++) {
                    uploadNextChunk();
                }
            };

            // 启动上传管理器
            uploadManager();

        } catch (error) {
            console.error('上传视频错误:', error);
            toast.error('视频上传失败', {
                description: '服务器错误，请稍后再试',
            });
            setUploadState(prev => prev ? { ...prev, status: 'error' } : null);
            if (onUploadError) onUploadError();
        } finally {
            isUploadingRef.current = false;
        }
    };

    // 暂停上传
    const pauseUpload = () => {
        if (uploadState && uploadState.status === 'uploading') {
            console.log('暂停上传');
            isPausedRef.current = true;
            setUploadState(prev => prev ? { ...prev, status: 'paused' } : null);
        }
    };

    // 完全重写继续上传函数
    const resumeUpload = async () => {
        if (uploadState && uploadState.status === 'paused') {
            console.log('继续上传');
            isPausedRef.current = false;
            setUploadState(prev => prev ? { ...prev, status: 'uploading' } : null);

            // 复制当前任务队列并清空原队列
            const tasks = [...uploadTasksRef.current];
            uploadTasksRef.current = [];

            // 如果队列中有任务，则执行这些任务
            if (tasks.length > 0) {
                console.log(`恢复执行 ${tasks.length} 个暂停的任务`);
                for (const task of tasks) {
                    if (isCancelledRef.current) break;
                    if (isPausedRef.current) {
                        // 如果在执行过程中又被暂停，将剩余任务重新加入队列
                        uploadTasksRef.current.push(task);
                        break;
                    }
                    await task();
                }
            } else {
                console.log('没有暂停的任务，重新开始上传未完成的分片');
                // 如果没有暂停的任务，则重新开始上传未完成的分片
                resumeIncompleteChunks();
            }
        }
    };

    // 添加一个新函数来处理恢复未完成分片的上传
    const resumeIncompleteChunks = async () => {
        if (!uploadState || !uploadState.file) return;

        const file = uploadState.file;
        const chunkSize = uploadState.chunkSize;
        const totalChunks = uploadState.totalChunks;
        const identifier = uploadState.identifier;
        const relativePath = generateRelativePath(file.type);

        // 创建待上传分片列表（排除已上传的分片）
        const pendingChunks: number[] = [];
        for (let i = 1; i <= totalChunks; i++) {
            if (!uploadedChunksRef.current.has(i)) {
                pendingChunks.push(i);
            }
        }

        console.log(`找到 ${pendingChunks.length} 个未完成的分片需要上传`);

        // 如果所有分片都已上传，则直接合并
        if (pendingChunks.length === 0 && !isMergingRef.current) {
            try {
                console.log('所有分片已上传，开始合并');
                const fileUrl = await mergeChunks(identifier, file.name, totalChunks, relativePath);
                setUploadState(prev => prev ? { ...prev, status: 'completed' } : null);
                onUploadComplete(fileUrl);
                return;
            } catch (error) {
                console.error('合并分片错误:', error);
                setUploadState(prev => prev ? { ...prev, status: 'error' } : null);
                if (onUploadError) onUploadError();
                return;
            }
        }

        // 使用并发上传未完成的分片
        const concurrency = 3; // 降低并发数，避免过多请求
        let activeUploads = 0;
        let completedChunks = 0;

        const uploadNextChunk = async () => {
            if (pendingChunks.length === 0) return;
            if (isCancelledRef.current) return;
            if (isPausedRef.current) return;

            activeUploads++;
            const chunkNumber = pendingChunks.shift()!;

            try {
                const start = (chunkNumber - 1) * chunkSize;
                const end = Math.min(start + chunkSize, file.size);
                const chunk = file.slice(start, end);

                const success = await uploadChunk(chunk, chunkNumber, identifier, file, totalChunks, relativePath);

                if (success) {
                    completedChunks++;
                    console.log(`分片 ${chunkNumber} 上传成功，已完成 ${completedChunks}/${pendingChunks.length + completedChunks}`);
                }
            } catch (error) {
                console.error(`上传分片 ${chunkNumber} 失败:`, error);
                // 失败的分片重新加入队列
                pendingChunks.push(chunkNumber);
            } finally {
                activeUploads--;

                // 继续上传下一个分片
                if (!isPausedRef.current && !isCancelledRef.current) {
                    uploadNextChunk();
                }

                // 检查是否所有分片都已上传
                if (activeUploads === 0 && pendingChunks.length === 0) {
                    if (uploadedChunksRef.current.size === totalChunks && !isMergingRef.current) {
                        try {
                            console.log('所有分片上传完成，开始合并');
                            const fileUrl = await mergeChunks(identifier, file.name, totalChunks, relativePath);
                            setUploadState(prev => prev ? { ...prev, status: 'completed' } : null);
                            onUploadComplete(fileUrl);
                        } catch (error) {
                            console.error('合并分片错误:', error);
                            setUploadState(prev => prev ? { ...prev, status: 'error' } : null);
                            if (onUploadError) onUploadError();
                        }
                    }
                }
            }
        };

        // 启动初始的并发上传
        for (let i = 0; i < Math.min(concurrency, pendingChunks.length); i++) {
            uploadNextChunk();
        }
    };

    // 修改取消上传函数
    const cancelUpload = () => {
        console.log('取消上传');
        isCancelledRef.current = true;
        isPausedRef.current = false;
        uploadTasksRef.current = [];
        isUploadingRef.current = false;
        isMergingRef.current = false;
        currentIdentifierRef.current = null;
        setUploadState(null);

        if (onUploadError) onUploadError();
    };

    // 修改渲染部分，添加更多状态信息
    return (
        <div className="space-y-4">
            {!initialFile && !uploadState && (
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
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                            {uploadState.status === 'uploading' && '正在上传...'}
                            {uploadState.status === 'paused' && '已暂停'}
                            {uploadState.status === 'completed' && '上传完成'}
                            {uploadState.status === 'error' && '上传失败'}
                        </p>

                        {/* 添加控制按钮 */}
                        <div className="flex space-x-2">
                            {uploadState.status === 'uploading' && (
                                <Button variant="outline" size="sm" onClick={pauseUpload}>
                                    暂停
                                </Button>
                            )}

                            {uploadState.status === 'paused' && (
                                <Button variant="outline" size="sm" onClick={resumeUpload}>
                                    继续
                                </Button>
                            )}

                            {(uploadState.status === 'uploading' || uploadState.status === 'paused') && (
                                <Button variant="destructive" size="sm" onClick={cancelUpload}>
                                    取消
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}