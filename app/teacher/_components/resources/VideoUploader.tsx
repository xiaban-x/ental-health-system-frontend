'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { Label } from '@/app/_components/ui/label';
import { apiClient } from '@/app/_lib/api-client';
import { toast } from 'sonner';
import ResourceForm from './ResourceForm';
import ChunkUploader from './ChunkUploader';

// 文件上传响应数据类型
interface FileUploadData {
    url: string;
    fileName: string;
}

interface VideoUploaderProps {
    onCancel: () => void;
    onSuccess: () => void;
}

export default function VideoUploader({ onCancel, onSuccess }: VideoUploaderProps) {
    const [videoForm, setVideoForm] = useState({
        title: '',
        description: '',
        duration: 0,
        coverImage: '',
        url: ''
    });
    const [loading, setLoading] = useState(false);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [uploadComplete, setUploadComplete] = useState(false);
    // 添加上传状态跟踪
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'completed' | 'error'>('idle');

    // 处理表单变化
    const handleFormChange = (name: string, value: string | number) => {
        setVideoForm(prev => ({ ...prev, [name]: value }));
    };

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

    // 上传封面图片
    const handleUploadCover = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        // 添加相对路径参数
        formData.append('relativePath', generateRelativePath(file.type));

        try {
            const response = await apiClient.post<FileUploadData>('/minio/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.code === 0 && response.data) {
                setVideoForm(prev => ({ ...prev, coverImage: response.data!.url }));
                return response.data.url;
            } else {
                toast.error('封面上传失败', {
                    description: response.msg || '服务器错误',
                });
                return null;
            }
        } catch (error) {
            console.error('上传封面错误:', error);
            toast.error('封面上传失败', {
                description: '服务器错误，请稍后再试',
            });
            return null;
        }
    };

    // 处理视频文件选择
    const handleVideoFileSelect = (file: File) => {
        setVideoFile(file);
        // 设置上传状态为上传中
        setUploadStatus('uploading');

        // 创建视频元素来获取时长
        const video = document.createElement('video');
        video.preload = 'metadata';

        video.onloadedmetadata = () => {
            window.URL.revokeObjectURL(video.src);
            const durationInSeconds = Math.round(video.duration);
            setVideoForm(prev => ({ ...prev, duration: durationInSeconds }));
        };

        video.src = URL.createObjectURL(file);
    };

    // 处理上传完成
    const handleUploadComplete = (url: string) => {
        setVideoForm(prev => ({ ...prev, url }));
        setUploadComplete(true);
        // 设置上传状态为已完成
        setUploadStatus('completed');
    };

    // 处理上传错误
    const handleUploadError = () => {
        setUploadStatus('error');
    };

    // 提交视频资源
    const handleSubmit = async () => {
        if (!videoForm.title.trim() || !videoForm.description.trim() || !videoForm.url) {
            toast.error('请完善视频信息', {
                description: '标题、简介和视频文件不能为空',
            });
            return;
        }

        setLoading(true);
        try {
            const response = await apiClient.post('/resource', {
                title: videoForm.title,
                description: videoForm.description,
                url: videoForm.url,
                type: 'video',
                duration: videoForm.duration,
                coverImage: videoForm.coverImage || null
            });

            if (response.code === 0) {
                onSuccess();
            } else {
                toast.error('视频资源创建失败', {
                    description: response.msg || '服务器错误',
                });
            }
        } catch (error) {
            console.error('创建视频资源错误:', error);
            toast.error('视频资源创建失败', {
                description: '服务器错误，请稍后再试',
            });
        } finally {
            setLoading(false);
        }
    };
    console.log("videoFile ===>", videoFile)
    return (
        <Card>
            <CardHeader>
                <CardTitle>上传视频</CardTitle>
                <CardDescription>上传新的视频资源</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <ResourceForm
                    formData={{
                        title: videoForm.title,
                        description: videoForm.description,
                        coverImage: videoForm.coverImage
                    }}
                    onChange={handleFormChange}
                    onUploadCover={handleUploadCover}
                />

                <div className="space-y-2">
                    <Label htmlFor="duration">视频时长 (秒)</Label>
                    <Input
                        id="duration"
                        type="number"
                        value={videoForm.duration || ''}
                        onChange={(e) => handleFormChange('duration', parseInt(e.target.value) || 0)}
                        placeholder="视频时长将在上传后自动获取"
                        disabled={!!videoFile}
                    />
                </div>

                <div className="space-y-2">
                    <Label>视频文件</Label>
                    {/* 修改渲染逻辑，根据上传状态决定显示内容 */}
                    {uploadStatus === 'idle' ? (
                        <ChunkUploader
                            onFileSelect={handleVideoFileSelect}
                            onUploadComplete={handleUploadComplete}
                            onUploadError={handleUploadError}
                        />
                    ) : (
                        <div className="flex flex-col space-y-2 p-4 border rounded-md">
                            {videoFile && (
                                <>
                                    <p className="font-medium">{videoFile.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        大小: {(videoFile.size / (1024 * 1024)).toFixed(2)} MB |
                                        类型: {videoFile.type} |
                                        时长: {Math.floor(videoForm.duration / 60)}分{videoForm.duration % 60}秒
                                    </p>
                                </>
                            )}
                            
                            {/* 根据上传状态显示不同内容 */}
                            {uploadStatus === 'uploading' && (
                                <div className="mt-2">
                                    <ChunkUploader
                                        onFileSelect={handleVideoFileSelect}
                                        onUploadComplete={handleUploadComplete}
                                        onUploadError={handleUploadError}
                                        initialFile={videoFile}
                                    />
                                </div>
                            )}
                            
                            {uploadStatus === 'completed' && (
                                <div className="flex items-center space-x-2 text-green-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                    </svg>
                                    <span>上传完成</span>
                                </div>
                            )}
                            
                            {uploadStatus === 'error' && (
                                <div className="flex items-center space-x-2 text-red-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="15" y1="9" x2="9" y2="15"></line>
                                        <line x1="9" y1="9" x2="15" y2="15"></line>
                                    </svg>
                                    <span>上传失败</span>
                                </div>
                            )}
                            
                            {/* 只有在上传完成或失败时才显示重新选择按钮 */}
                            {(uploadStatus === 'completed' || uploadStatus === 'error') && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setVideoFile(null);
                                        setUploadComplete(false);
                                        setVideoForm(prev => ({ ...prev, url: '', duration: 0 }));
                                        setUploadStatus('idle');
                                    }}
                                >
                                    重新选择
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={onCancel}>
                    取消
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={loading || !uploadComplete || !videoForm.title || !videoForm.description}
                >
                    {loading ? '提交中...' : '发布视频'}
                </Button>
            </CardFooter>
        </Card>
    );
}