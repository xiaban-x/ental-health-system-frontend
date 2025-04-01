'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_components/ui/tabs';
import { apiClient, useApi } from '@/app/_lib/api-client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Clock, Calendar, User, Eye, ThumbsUp, Search } from 'lucide-react';
import { Input } from '@/app/_components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/app/_components/ui/pagination';
import dynamic from 'next/dynamic';

// 动态导入视频播放器，避免SSR问题
const ReactPlayer = dynamic(() => import('react-player/lazy'), {
  ssr: false,
  loading: () => <div className="w-full aspect-video bg-gray-200 animate-pulse flex items-center justify-center">
    <p>加载播放器中...</p>
  </div>
});

// 资源类型接口
interface Resource {
  id: number;
  title: string;
  description: string;
  content?: string | null;
  url: string | null;
  coverImage?: string | null;
  type: 'article' | 'video' | 'tool';
  duration?: number | null;
  size?: number | null;
  format?: string | null;
  authorId: number;
  authorName: string;
  viewCount: number;
  likeCount: number;
  status: number;
  createdAt: string;
  updatedAt: string;
}

// 分页响应接口
interface PaginatedResponse<T> {
  list: T[];
  total: number;
  totalPage: number;
  currentPage: number;
}

export default function StudentResources() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'article' | 'video'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResource, setSelectedResource] = useState<number | null>(null);
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(false);

  // 使用封装好的 useApi 钩子获取资源列表
  const { data, error, isLoading, mutate } = useApi<PaginatedResponse<Resource>>(
    `/resource/list?page=${currentPage}&size=${pageSize}&type=${activeTab === 'all' ? '' : activeTab}`
  );

  useEffect(() => {
    // 检查用户是否已登录
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'student') {
      router.push('/auth/login');
      return;
    }
  }, [router]);

  // 处理页码变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 处理每页显示数量变化
  const handlePageSizeChange = (value: string) => {
    const newSize = parseInt(value);
    setPageSize(newSize);
    setCurrentPage(1); // 重置到第一页
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm');
    } catch (error) {
      return dateString;
    }
  };

  // 格式化时长
  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return '未知';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 获取资源详情
  const fetchResourceDetail = async (resourceId: number) => {
    setLoading(true);
    try {
      const response = await apiClient.get<{ resource: Resource, tags: [] }>(`/resource/${resourceId}`);
      if (response.code === 0 && response.data?.resource) {
        setResource(response.data.resource);
      } else {
        toast.error('获取资源失败', {
          description: response.msg || '服务器错误',
        });
      }
    } catch (error) {
      console.error('获取资源错误:', error);
      toast.error('获取资源失败', {
        description: '服务器错误，请稍后再试',
      });
    } finally {
      setLoading(false);
    }
  };

  // 处理资源预览
  const handlePreview = (resourceId: number) => {
    setSelectedResource(resourceId);
    fetchResourceDetail(resourceId);
  };

  // 处理返回列表
  const handleBackToList = () => {
    setSelectedResource(null);
    setResource(null);
  };

  // 渲染文章内容
  const renderArticleContent = (content?: string | null) => {
    if (!content) return <p className="text-gray-500">无内容</p>;
    return (
      <div 
        className="prose max-w-none" 
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  };

  // 渲染视频播放器
  const renderVideoPlayer = (url?: string | null) => {
    if (!url) return <p className="text-gray-500">视频链接无效</p>;
    return (
      <div className="w-full aspect-video">
        <ReactPlayer
          url={url}
          width="100%"
          height="100%"
          controls
          config={{
            file: {
              attributes: {
                controlsList: 'nodownload',
                disablePictureInPicture: true,
              },
            },
          }}
        />
      </div>
    );
  };

  // 渲染视频卡片（B站风格）
  const renderVideoCard = (resource: Resource) => {
    return (
      <div 
        key={resource.id} 
        className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => handlePreview(resource.id)}
      >
        <div className="relative">
          {/* 封面图片 */}
          <div className="aspect-video bg-gray-200 overflow-hidden">
            {resource.coverImage ? (
              <img 
                src={resource.coverImage} 
                alt={resource.title} 
                className="w-full h-full object-cover transition-transform hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <span className="text-gray-400">无封面</span>
              </div>
            )}
          </div>
          
          {/* 视频时长 */}
          {resource.duration && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
              {formatDuration(resource.duration)}
            </div>
          )}
        </div>
        
        <div className="p-3">
          {/* 标题 */}
          <h3 className="font-medium text-sm line-clamp-2 h-10">{resource.title}</h3>
          
          {/* 视频信息 */}
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center">
              <User className="h-3 w-3 mr-1" />
              <span className="truncate max-w-[100px]">{resource.authorName}</span>
            </div>
            <div className="flex items-center">
              <Eye className="h-3 w-3 mr-1" />
              <span>{resource.viewCount}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 渲染文章卡片（掘金风格）
  const renderArticleCard = (resource: Resource) => {
    return (
      <div 
        key={resource.id} 
        className="bg-white rounded-lg p-4 mb-4 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => handlePreview(resource.id)}
      >
        <div className="flex">
          <div className="flex-1 pr-4">
            <h3 className="font-medium text-lg mb-2">{resource.title}</h3>
            <p className="text-gray-500 text-sm line-clamp-2 mb-3">{resource.description}</p>
            
            <div className="flex items-center text-xs text-gray-400 space-x-3">
              <div className="flex items-center">
                <User className="h-3 w-3 mr-1" />
                <span>{resource.authorName}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                <span>{formatDate(resource.createdAt).split(' ')[0]}</span>
              </div>
              <div className="flex items-center">
                <Eye className="h-3 w-3 mr-1" />
                <span>{resource.viewCount} 阅读</span>
              </div>
              <div className="flex items-center">
                <ThumbsUp className="h-3 w-3 mr-1" />
                <span>{resource.likeCount} 点赞</span>
              </div>
            </div>
          </div>
          
          {resource.coverImage && (
            <div className="w-32 h-20 flex-shrink-0">
              <img 
                src={resource.coverImage} 
                alt={resource.title} 
                className="w-full h-full object-cover rounded"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  // 显示资源详情
  if (selectedResource && resource) {
    return (
      <div className="min-h-screen bg-muted p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">{resource.title}</CardTitle>
                <Button variant="outline" size="sm" onClick={handleBackToList}>
                  返回列表
                </Button>
              </div>
              <CardDescription>
                <div className="flex flex-wrap gap-4 mt-2">
                  <div className="flex items-center text-sm">
                    <User className="h-4 w-4 mr-1" />
                    {resource.authorName || '未知作者'}
                  </div>
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(resource.createdAt)}
                  </div>
                  {resource.type === 'video' && resource.duration && (
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatDuration(resource.duration)}
                    </div>
                  )}
                  <div className="flex items-center text-sm">
                    <Eye className="h-4 w-4 mr-1" />
                    {resource.viewCount} 次查看
                  </div>
                  <div className="flex items-center text-sm">
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    {resource.likeCount} 次点赞
                  </div>
                </div>
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* 封面图片 */}
              {resource.coverImage && (
                <div className="w-full">
                  <img 
                    src={resource.coverImage} 
                    alt={resource.title} 
                    className="w-full max-h-[300px] object-cover rounded-md"
                  />
                </div>
              )}
              
              {/* 描述 */}
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-lg font-medium mb-2">简介</h3>
                <p className="text-gray-700">{resource.description}</p>
              </div>
              
              {/* 内容 - 根据资源类型显示不同内容 */}
              <div>
                <h3 className="text-lg font-medium mb-4">
                  {resource.type === 'article' ? '文章内容' : 
                   resource.type === 'video' ? '视频内容' : '资源内容'}
                </h3>
                
                {resource.type === 'article' ? (
                  renderArticleContent(resource.content)
                ) : resource.type === 'video' ? (
                  renderVideoPlayer(resource.url)
                ) : (
                  <p className="text-gray-500">暂不支持预览此类型资源</p>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between border-t pt-4">
              <div className="text-sm text-gray-500">
                最后更新: {formatDate(resource.updatedAt)}
              </div>
              <Button onClick={handleBackToList}>返回列表</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  // 显示资源列表
  return (
    <div className="min-h-screen bg-muted p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">心理健康资源</h1>
          <Button variant="outline" onClick={() => router.push('/student/dashboard')}>
            返回仪表盘
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>浏览资源</CardTitle>
            <CardDescription>查看教师发布的心理健康文章和视频资源</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* 搜索和筛选 */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="搜索资源..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Select
                    value={String(pageSize)}
                    onValueChange={handlePageSizeChange}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="每页数量" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8">8 条/页</SelectItem>
                      <SelectItem value="12">12 条/页</SelectItem>
                      <SelectItem value="24">24 条/页</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 资源类型标签页 */}
              <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'article' | 'video')}>
                <TabsList>
                  <TabsTrigger value="all">全部资源</TabsTrigger>
                  <TabsTrigger value="article">文章</TabsTrigger>
                  <TabsTrigger value="video">视频</TabsTrigger>
                </TabsList>

                {/* 全部资源 */}
                <TabsContent value="all" className="space-y-6">
                  {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {Array(8).fill(0).map((_, index) => (
                        <div key={index} className="bg-gray-100 animate-pulse rounded-lg h-64"></div>
                      ))}
                    </div>
                  ) : error ? (
                    <div className="text-center py-10">
                      <p className="text-red-500">加载资源失败，请刷新页面重试</p>
                    </div>
                  ) : data?.list && data.list.length > 0 ? (
                    <>
                      {/* 视频资源（卡片式） */}
                      {data.list.filter(r => r.type === 'video').length > 0 && (
                        <div className="space-y-4">
                          <h2 className="text-xl font-semibold">视频资源</h2>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {data.list
                              .filter(r => r.type === 'video')
                              .filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase()))
                              .map(resource => renderVideoCard(resource))
                            }
                          </div>
                        </div>
                      )}
                      
                      {/* 文章资源（列表式） */}
                      {data.list.filter(r => r.type === 'article').length > 0 && (
                        <div className="space-y-4">
                          <h2 className="text-xl font-semibold">文章资源</h2>
                          <div className="space-y-4">
                            {data.list
                              .filter(r => r.type === 'article')
                              .filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase()))
                              .map(resource => renderArticleCard(resource))
                            }
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-gray-500">暂无资源</p>
                    </div>
                  )}
                </TabsContent>

                {/* 文章资源 */}
                <TabsContent value="article" className="space-y-6">
                  {isLoading ? (
                    <div className="space-y-4">
                      {Array(5).fill(0).map((_, index) => (
                        <div key={index} className="bg-gray-100 animate-pulse rounded-lg h-24"></div>
                      ))}
                    </div>
                  ) : error ? (
                    <div className="text-center py-10">
                      <p className="text-red-500">加载资源失败，请刷新页面重试</p>
                    </div>
                  ) : data?.list && data.list.length > 0 ? (
                    <div className="space-y-4">
                      {data.list
                        .filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(resource => renderArticleCard(resource))
                      }
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-gray-500">暂无文章资源</p>
                    </div>
                  )}
                </TabsContent>

                {/* 视频资源 */}
                <TabsContent value="video" className="space-y-6">
                  {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {Array(8).fill(0).map((_, index) => (
                        <div key={index} className="bg-gray-100 animate-pulse rounded-lg h-64"></div>
                      ))}
                    </div>
                  ) : error ? (
                    <div className="text-center py-10">
                      <p className="text-red-500">加载资源失败，请刷新页面重试</p>
                    </div>
                  ) : data?.list && data.list.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {data.list
                        .filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(resource => renderVideoCard(resource))
                      }
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-gray-500">暂无视频资源</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* 分页 */}
              {data && data.totalPage > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: data.totalPage }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          isActive={currentPage === page}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(Math.min(data.totalPage, currentPage + 1))}
                        className={currentPage === data.totalPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}