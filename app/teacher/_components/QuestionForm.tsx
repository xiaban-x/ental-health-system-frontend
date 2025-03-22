'use client';

import { FormEvent, useState, useEffect } from 'react';
import { Button } from '@/app/_components/ui/button';
import { Checkbox } from '@/app/_components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/app/_components/ui/radio-group';
import { toast } from 'sonner';

// 更新接口定义
interface QuestionFormProps {
    onSubmit: (data: QuestionData) => void;
    onCancel: () => void;
    initialData?: QuestionData;
    paperId: number;
    paperName: string;
}

export interface QuestionData {
    paperId: number;
    paperName: string;
    questionName: string;
    options: string;
    score: number;
    answer: string;
    analysis: string;
    type: number;
    sequence: number;
}

interface Option {
    label: string;
    value: string;
    text: string;
}

export default function QuestionForm({ onSubmit, onCancel, initialData, paperId, paperName }: QuestionFormProps) {
    // 默认选项
    const defaultOptions = [
        { label: 'A', value: '1', text: '' },
        { label: 'B', value: '2', text: '' }
    ];

    const [formData, setFormData] = useState<QuestionData>({
        paperId,
        paperName,
        questionName: '',
        options: JSON.stringify(defaultOptions),
        score: 1,
        answer: '',
        analysis: '',
        type: 0,
        sequence: 0
    });

    // 用于存储选择题的答案
    const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
    
    // 初始化表单数据
    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
            // 如果是多选题，解析答案字符串为数组
            if (initialData.type === 1 && initialData.answer) {
                setSelectedAnswers(initialData.answer.split(','));
            } else if (initialData.type === 0 && initialData.answer) {
                setSelectedAnswers([initialData.answer]);
            }
        }
    }, [initialData]);

    // 处理类型转换，确保type是数字
    const getType = (): number => {
        return typeof formData.type === 'string' ? parseInt(formData.type, 10) : formData.type;
    };

    // 当题目类型改变时重置相关状态
    useEffect(() => {
        const type = getType();
        
        // 重置答案
        setSelectedAnswers([]);
        setFormData(prev => ({ ...prev, answer: '' }));
    }, [formData.type]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        // 特殊处理type字段，确保它是数字类型
        if (name === 'type') {
            setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    // 安全解析选项
    const getOptions = (): Option[] => {
        try {
            const options = JSON.parse(formData.options);
            return Array.isArray(options) && options.length >= 2 ? options : defaultOptions;
        } catch (e) {
            return defaultOptions;
        }
    };

    const handleOptionChange = (index: number, text: string) => {
        const options = getOptions();
        options[index].text = text;
        setFormData(prev => ({ ...prev, options: JSON.stringify(options) }));
    };

    const handleAnswerChange = (value: string | string[]) => {
        if (Array.isArray(value)) {
            setSelectedAnswers(value);
            setFormData(prev => ({ ...prev, answer: value.join(',') }));
        } else {
            setSelectedAnswers([value]);
            setFormData(prev => ({ ...prev, answer: value }));
        }
    };

    const addOption = () => {
        const options = getOptions();
        const newLabel = String.fromCharCode(65 + options.length);
        options.push({
            label: newLabel,
            value: (options.length + 1).toString(),
            text: ''
        });
        setFormData(prev => ({ ...prev, options: JSON.stringify(options) }));
    };

    const removeOption = (index: number) => {
        const options = getOptions();
        if (options.length <= 2) return;
        
        options.splice(index, 1);
        
        // 重新编号
        options.forEach((opt: Option, idx: number) => {
            opt.label = String.fromCharCode(65 + idx);
            opt.value = (idx + 1).toString();
        });
        
        setFormData(prev => ({ ...prev, options: JSON.stringify(options) }));
        
        // 更新答案（移除已删除选项的值）
        const updatedAnswers = selectedAnswers.filter(ans => 
            options.some((opt: Option) => opt.value === ans)
        );
        setSelectedAnswers(updatedAnswers);
        setFormData(prev => ({ ...prev, answer: updatedAnswers.join(',') }));
    };

    const validateForm = (): boolean => {
        const type = getType();
        
        // 验证多选题至少选择两个选项
        if (type === 1) {
            if (selectedAnswers.length < 2) {
                toast.error("多选题至少需要选择两个答案", {
                    position: "top-center"
                });
                return false;
            }
        }
        
        // 验证选择题必须有答案
        if ([0, 1].includes(type) && !formData.answer) {
            toast.error("请选择正确答案", {
                position: "top-center"
            });
            return false;
        }
        
        return true;
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <label htmlFor="questionName" className="text-sm font-medium">
                    问题内容 <span className="text-red-500">*</span>
                </label>
                <textarea
                    id="questionName"
                    name="questionName"
                    value={formData.questionName}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary min-h-[80px]"
                    placeholder="请输入问题内容"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label htmlFor="type" className="text-sm font-medium">
                        题目类型 <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary"
                    >
                        <option value={0}>单选题</option>
                        <option value={1}>多选题</option>
                        <option value={2}>判断题</option>
                        <option value={3}>填空题</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label htmlFor="score" className="text-sm font-medium">
                        分值 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        id="score"
                        name="score"
                        value={formData.score}
                        onChange={handleChange}
                        min={1}
                        max={100}
                        required
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary"
                    />
                </div>
            </div>

            {/* 选择题选项和答案 */}
            {[0, 1].includes(getType()) && (
                <div className="space-y-4">
                    {/* 选项编辑 */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            选项 <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2">
                            {getOptions().map((option: Option, index: number) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <span className="w-8">{option.label}.</span>
                                    <input
                                        type="text"
                                        value={option.text}
                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                        className="flex-1 p-2 border rounded-md focus:ring-2 focus:ring-primary"
                                        placeholder={`选项 ${option.label}`}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeOption(index)}
                                        className="p-2 text-red-500 hover:text-red-700"
                                        disabled={getOptions().length <= 2}
                                    >
                                        删除
                                    </button>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addOption}
                                className="mt-2"
                            >
                                添加选项
                            </Button>
                        </div>
                    </div>

                    {/* 答案选择 */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            正确答案 <span className="text-red-500">*</span>
                            {getType() === 1 && <span className="text-xs text-gray-500 ml-2">(至少选择两个)</span>}
                        </label>
                        <div className="space-y-2">
                            {getType() === 0 ? (
                                <RadioGroup
                                    value={formData.answer}
                                    onValueChange={(value) => handleAnswerChange(value)}
                                    className="space-y-2"
                                >
                                    {getOptions().map((option: Option) => (
                                        <div key={option.value} className="flex items-center space-x-2">
                                            <RadioGroupItem value={option.value} id={`answer-${option.value}`} />
                                            <label htmlFor={`answer-${option.value}`}>{option.label}</label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            ) : (
                                <div className="space-y-2">
                                    {getOptions().map((option: Option) => (
                                        <div key={option.value} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`answer-${option.value}`}
                                                checked={selectedAnswers.includes(option.value)}
                                                onCheckedChange={(checked) => {
                                                    const newAnswers = checked
                                                        ? [...selectedAnswers, option.value]
                                                        : selectedAnswers.filter(v => v !== option.value);
                                                    handleAnswerChange(newAnswers);
                                                }}
                                            />
                                            <label htmlFor={`answer-${option.value}`}>{option.label}</label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 判断题答案 */}
            {getType() === 2 && (
                <div className="space-y-2">
                    <label htmlFor="answer" className="text-sm font-medium">
                        正确答案 <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="answer"
                        name="answer"
                        value={formData.answer}
                        onChange={handleChange}
                        required
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary"
                    >
                        <option value="">请选择</option>
                        <option value="1">正确</option>
                        <option value="0">错误</option>
                    </select>
                </div>
            )}

            {/* 填空题答案 */}
            {getType() === 3 && (
                <div className="space-y-2">
                    <label htmlFor="answer" className="text-sm font-medium">
                        正确答案 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="answer"
                        name="answer"
                        value={formData.answer}
                        onChange={handleChange}
                        required
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary"
                        placeholder="请输入正确答案"
                    />
                </div>
            )}

            {/* 答案解析 */}
            <div className="space-y-2">
                <label htmlFor="analysis" className="text-sm font-medium">
                    答案解析
                </label>
                <textarea
                    id="analysis"
                    name="analysis"
                    value={formData.analysis}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary min-h-[80px]"
                    placeholder="请输入答案解析（选填）"
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="sequence" className="text-sm font-medium">
                    题目排序 <span className="text-red-500">*</span>
                </label>
                <input
                    type="number"
                    id="sequence"
                    name="sequence"
                    value={formData.sequence}
                    onChange={handleChange}
                    min={1}
                    required
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary"
                    placeholder="数值越大排序越靠前"
                />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                    取消
                </Button>
                <Button type="submit">
                    保存问题
                </Button>
            </div>
        </form>
    );
}