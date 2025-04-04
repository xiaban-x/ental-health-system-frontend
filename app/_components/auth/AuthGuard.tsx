'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';

interface AuthGuardProps {
    children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // 登录页面不需要鉴权
        if (pathname.includes('/auth/')) {
            setIsAuthorized(true);
            setIsLoading(false);
            return;
        }

        // 首页不需要鉴权
        if (pathname === '/') {
            setIsAuthorized(true);
            setIsLoading(false);
            return;
        }

        // 检查用户是否已登录
        const token = localStorage.getItem('token');
        const userRole = localStorage.getItem('role');

        // 根据路径自动判断所需角色
        let requiredRole: string | null = null;

        if (pathname.startsWith('/teacher')) {
            requiredRole = 'teacher';
        } else if (pathname.startsWith('/student')) {
            requiredRole = 'student';
        } else if (pathname.startsWith('/admin')) {
            requiredRole = 'admin';
        }

        // 如果不需要特定角色，只要有token就可以
        if (!requiredRole) {
            if (token) {
                setIsAuthorized(true);
                setIsLoading(false);
            } else {
                toast.error('请先登录', {
                    description: '您需要登录才能访问此页面',
                    position: 'top-center'
                });
                router.push('/auth/login');
            }
            return;
        }
        console.log("role ===>", userRole, requiredRole)
        // 需要特定角色
        if (!token || userRole !== requiredRole) {
            // 未登录或角色不匹配
            const roleName =
                requiredRole === 'teacher' ? '教师' :
                    requiredRole === 'student' ? '学生' :
                        requiredRole === 'admin' ? '管理员' : '用户';

            toast.error('请先登录', {
                description: `您需要登录${roleName}账号才能访问此页面`,
                position: 'top-center'
            });
            router.push('/auth/login');
            return;
        }

        // 已登录且角色匹配
        setIsAuthorized(true);
        setIsLoading(false);
    }, [router, pathname]);

    // 显示加载状态
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted">
                <p className="text-lg">加载中...</p>
            </div>
        );
    }

    // 已授权，显示子组件
    if (isAuthorized) {
        return <>{children}</>;
    }

    // 默认返回空内容（实际上不会执行到这里，因为未授权会重定向）
    return null;
}