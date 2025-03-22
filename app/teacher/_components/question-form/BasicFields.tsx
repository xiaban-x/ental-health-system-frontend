import React from 'react';

interface BasicFieldsProps {
    questionName: string;
    type: number;
    score: number;
    sequence: number;
    analysis: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export default function BasicFields({
    questionName,
    type,
    score,
    sequence,
    analysis,
    onChange
}: BasicFieldsProps) {
    return (
        <>
            <div className="space-y-2">
                <label htmlFor="questionName" className="text-sm font-medium">
                    问题内容 <span className="text-red-500">*</span>
                </label>
                <textarea
                    id="questionName"
                    name="questionName"
                    value={questionName}
                    onChange={onChange}
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
                        value={type}
                        onChange={onChange}
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
                        value={score}
                        onChange={onChange}
                        min={1}
                        max={100}
                        required
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label htmlFor="analysis" className="text-sm font-medium">
                    答案解析
                </label>
                <textarea
                    id="analysis"
                    name="analysis"
                    value={analysis}
                    onChange={onChange}
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
                    value={sequence}
                    onChange={onChange}
                    min={1}
                    required
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary"
                    placeholder="数值越大排序越靠前"
                />
            </div>
        </>
    );
}