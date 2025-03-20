'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/app/_components/ui/button';

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

export default function QuestionForm({ onSubmit, onCancel, initialData, paperId, paperName }: QuestionFormProps) {
    const [formData, setFormData] = useState<QuestionData>({
        paperId,
        paperName,
        questionName: initialData?.questionName || '',
        options: initialData?.options || JSON.stringify([
            { label: 'A', value: '1', text: '' },
            { label: 'B', value: '2', text: '' }
        ]),
        score: initialData?.score || 5,
        answer: initialData?.answer || '',
        analysis: initialData?.analysis || '',
        type: initialData?.type || 0,
        sequence: initialData?.sequence || 100,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const target = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: target.checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleOptionChange = (index: number, text: string) => {
        const options = JSON.parse(formData.options);
        options[index].text = text;
        setFormData(prev => ({ ...prev, options: JSON.stringify(options) }));
    };

    const addOption = () => {
        const options = JSON.parse(formData.options);
        const newLabel = String.fromCharCode(65 + options.length); // A, B, C...
        options.push({
            label: newLabel,
            value: (options.length + 1).toString(),
            text: ''
        });
        setFormData(prev => ({ ...prev, options: JSON.stringify(options) }));
    };

    const removeOption = (index: number) => {
        const options = JSON.parse(formData.options);
        if (options.length <= 2) return;
        options.splice(index, 1);
        // 重新排序选项的 label 和 value
        options.forEach((opt: any, idx: number) => {
            opt.label = String.fromCharCode(65 + idx);
            opt.value = (idx + 1).toString();
        });
        setFormData(prev => ({ ...prev, options: JSON.stringify(options) }));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSubmit(formData);  // 直接传递 formData
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

            {[0, 1].includes(formData.type) && (
                <div className="space-y-2">
                    <label className="text-sm font-medium">
                        选项 <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                        {JSON.parse(formData.options).map((option: any, index: number) => (
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
                                    disabled={JSON.parse(formData.options).length <= 2}
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
            )}

            {formData.type === 2 && (
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

            {formData.type === 3 && (
                <div className="space-y-2">
                    <label htmlFor="answer" className="text-sm font-medium">
                        参考答案 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="answer"
                        name="answer"
                        value={formData.answer}
                        onChange={handleChange}
                        required
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary"
                        placeholder="请输入参考答案"
                    />
                </div>
            )}

            <div className="space-y-2">
                <label htmlFor="analysis" className="text-sm font-medium">
                    答案解析
                </label>
                <textarea
                    id="analysis"
                    name="analysis"
                    value={formData.analysis}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary"
                    placeholder="请输入答案解析"
                    rows={3}
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