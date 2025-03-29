'use client';

import { useRef } from 'react';
import { Input } from '@/app/_components/ui/input';
import { Label } from '@/app/_components/ui/label';
import { Textarea } from '@/app/_components/ui/textarea';
import { Button } from '@/app/_components/ui/button';
import { toast } from 'sonner';

interface ResourceFormProps {
    formData: {
        title: string;
        description: string;
        coverImage?: string;
    };
    onChange: (name: string, value: string) => void;
    onUploadCover: (file: File) => Promise<string | null>;
}

export default function ResourceForm({ formData, onChange, onUploadCover }: ResourceFormProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // 处理表单变化
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        onChange(name, value);
    };
    
    // 处理封面上传
    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // 检查文件类型
        if (!file.type.startsWith('image/')) {
            toast.error('请选择图片文件');
            return;
        }
        
        // 检查文件大小
        if (file.size > 5 * 1024 * 1024) { // 5MB
            toast.error('图片大小不能超过5MB');
            return;
        }
        
        await onUploadCover(file);
    };
    
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="title">标题</Label>
                <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="请输入标题"
                />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="description">简介</Label>
                <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="请输入简介"
                    rows={3}
                />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="coverImage">封面图片</Label>
                <div className="flex items-center space-x-4">
                    <input
                        ref={fileInputRef}
                        id="coverImage"
                        type="file"
                        accept="image/*"
                        onChange={handleCoverUpload}
                        className="hidden"
                    />
                    <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        选择封面图片
                    </Button>
                    
                    {formData.coverImage && (
                        <div className="relative">
                            <img 
                                src={formData.coverImage} 
                                alt="封面预览" 
                                className="h-20 w-auto object-cover rounded"
                            />
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                onClick={() => onChange('coverImage', '')}
                            >
                                ×
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}