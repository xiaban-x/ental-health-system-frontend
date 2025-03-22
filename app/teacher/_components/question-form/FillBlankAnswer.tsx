interface FillBlankAnswerProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function FillBlankAnswer({ value, onChange }: FillBlankAnswerProps) {
    return (
        <div className="space-y-2">
            <label htmlFor="answer" className="text-sm font-medium">
                正确答案
            </label>
            <input
                type="text"
                id="answer"
                name="answer"
                value={value}
                onChange={onChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary"
                placeholder="请输入正确答案（选填）"
            />
        </div>
    );
}