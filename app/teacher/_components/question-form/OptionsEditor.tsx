import { Button } from '@/app/_components/ui/button';
import { Option } from './types';

interface OptionsEditorProps {
    options: Option[];
    onOptionChange: (index: number, text: string) => void;
    onAddOption: () => void;
    onRemoveOption: (index: number) => void;
}

export default function OptionsEditor({ 
    options, 
    onOptionChange, 
    onAddOption, 
    onRemoveOption 
}: OptionsEditorProps) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">
                选项 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
                {options.map((option: Option, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                        <span className="w-8">{option.label}.</span>
                        <input
                            type="text"
                            value={option.text}
                            onChange={(e) => onOptionChange(index, e.target.value)}
                            className="flex-1 p-2 border rounded-md focus:ring-2 focus:ring-primary"
                            placeholder={`选项 ${option.label}`}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => onRemoveOption(index)}
                            className="p-2 text-red-500 hover:text-red-700"
                            disabled={options.length <= 2}
                        >
                            删除
                        </button>
                    </div>
                ))}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onAddOption}
                    className="mt-2"
                >
                    添加选项
                </Button>
            </div>
        </div>
    );
}