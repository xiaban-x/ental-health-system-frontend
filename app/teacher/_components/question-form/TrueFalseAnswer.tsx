interface TrueFalseAnswerProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export default function TrueFalseAnswer({ value, onChange }: TrueFalseAnswerProps) {
    return (
        <div className="space-y-2">
            <label htmlFor="answer" className="text-sm font-medium">
                正确答案 <span className="text-red-500">*</span>
            </label>
            <select
                id="answer"
                name="answer"
                value={value}
                onChange={onChange}
                required
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary"
            >
                <option value="">请选择</option>
                <option value="1">正确</option>
                <option value="0">错误</option>
            </select>
        </div>
    );
}