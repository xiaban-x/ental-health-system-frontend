'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/app/_components/ui/button';
import { toast } from 'sonner';
import { QuestionData, Option } from './question-form/types';
import OptionsEditor from './question-form/OptionsEditor';
import SingleChoiceAnswer from './question-form/SingleChoiceAnswer';
import MultiChoiceAnswer from './question-form/MultiChoiceAnswer';
import TrueFalseAnswer from './question-form/TrueFalseAnswer';
import FillBlankAnswer from './question-form/FillBlankAnswer';

interface QuestionFormProps {
    onSubmit: (data: QuestionData) => void;
    onCancel: () => void;
    initialData?: QuestionData;
    paperId: number;
    paperName: string;
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

    // 移除 selectedAnswers 状态

    // 初始化表单数据
    useEffect(() => {
        console.log("initialData ===>", initialData);
        if (initialData) {
            // 直接设置表单数据，包括答案
            setFormData({
                ...initialData,
                // 确保数字类型字段是数字
                type: typeof initialData.type === 'string' ? parseInt(initialData.type, 10) : initialData.type,
                score: typeof initialData.score === 'string' ? parseInt(initialData.score, 10) : initialData.score,
                sequence: typeof initialData.sequence === 'string' ? parseInt(initialData.sequence, 10) : initialData.sequence
            });
        }
    }, [initialData]);
    // 处理类型转换，确保type是数字
    const getType = (): number => {
        return typeof formData.type === 'string' ? parseInt(formData.type, 10) : formData.type;
    };

    // 当题目类型改变时重置相关状态
    useEffect(() => {
        // 只有在非编辑模式下才重置答案
        if (!initialData) {
            setFormData(prev => ({ ...prev, answer: '' }));
        }
    }, [formData.type, initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        // 特殊处理数字类型字段，确保它们是数字类型
        if (['type', 'score', 'sequence'].includes(name)) {
            setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
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

    // 修改处理答案变更的函数
    const handleAnswerChange = (value: string | string[]) => {
        if (Array.isArray(value)) {
            // 多选题答案，用逗号连接
            setFormData(prev => ({ ...prev, answer: value.join(',') }));
        } else {
            // 单选题答案，直接设置
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

        const removedOption = options[index];
        options.splice(index, 1);

        // 重新编号
        options.forEach((opt: Option, idx: number) => {
            opt.label = String.fromCharCode(65 + idx);
            opt.value = (idx + 1).toString();
        });

        setFormData(prev => ({ ...prev, options: JSON.stringify(options) }));

        // 更新答案（移除已删除选项的值）
        const type = getType();
        if (type === 0) {
            // 单选题
            if (formData.answer === removedOption.value) {
                setFormData(prev => ({ ...prev, answer: '' }));
            }
        } else if (type === 1) {
            // 多选题
            const answers = formData.answer ? formData.answer.split(',') : [];
            const updatedAnswers = answers.filter(ans =>
                options.some(opt => opt.value === ans)
            );
            setFormData(prev => ({ ...prev, answer: updatedAnswers.join(',') }));
        }
    };

    const validateForm = (): boolean => {
        const type = getType();

        // 验证多选题至少选择两个选项
        if (type === 1) {
            if (formData.answer.length < 2) {
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

        // 验证判断题必须有答案
        if (type === 2 && !formData.answer) {
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

        // 确保答案格式正确
        const type = getType();
        let finalAnswer = formData.answer;

        // 单选题和多选题的答案处理已经在 handleAnswerChange 中完成
        // 判断题答案确认
        if (type === 2 && formData.answer) {
            // 确保判断题答案是 "1" 或 "0"
            finalAnswer = formData.answer === "1" ? "1" : "0";
        }

        // 提交最终数据
        onSubmit({
            ...formData,
            type: type,
            score: typeof formData.score === 'string' ? parseInt(formData.score, 10) : formData.score,
            sequence: typeof formData.sequence === 'string' ? parseInt(formData.sequence, 10) : formData.sequence,
            answer: finalAnswer
        });
    };
    console.log("formData ===>", formData)
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
                    <OptionsEditor
                        options={getOptions()}
                        onOptionChange={handleOptionChange}
                        onAddOption={addOption}
                        onRemoveOption={removeOption}
                    />

                    {getType() === 0 ? (
                        <SingleChoiceAnswer
                            options={getOptions()}
                            value={formData.answer}
                            onValueChange={(value) => handleAnswerChange(value)}
                        />
                    ) : (
                        <MultiChoiceAnswer
                            options={getOptions()}
                            selectedValues={formData.answer ? formData.answer.split(',') : []}
                            onValuesChange={(values) => handleAnswerChange(values)}
                        />
                    )}
                </div>
            )}

            {/* 判断题答案 */}
            {getType() === 2 && (
                <TrueFalseAnswer
                    value={formData.answer}
                    onChange={handleChange}
                />
            )}

            {/* 填空题答案 - 非必填 */}
            {getType() === 3 && (
                <FillBlankAnswer
                    value={formData.answer}
                    onChange={handleChange}
                />
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