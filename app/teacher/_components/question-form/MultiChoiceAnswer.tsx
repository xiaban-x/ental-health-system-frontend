import { Checkbox } from '@/app/_components/ui/checkbox';
import { Option } from './types';

interface MultiChoiceAnswerProps {
    options: Option[];
    selectedValues: string[];
    onValuesChange: (values: string[]) => void;
}

export default function MultiChoiceAnswer({ 
    options, 
    selectedValues, 
    onValuesChange 
}: MultiChoiceAnswerProps) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">
                正确答案 <span className="text-red-500">*</span>
                <span className="text-xs text-gray-500 ml-2">(至少选择两个)</span>
            </label>
            <div className="space-y-2">
                {options.map((option: Option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                            id={`answer-${option.value}`}
                            checked={selectedValues.includes(option.value)}
                            onCheckedChange={(checked) => {
                                const newValues = checked
                                    ? [...selectedValues, option.value]
                                    : selectedValues.filter(v => v !== option.value);
                                onValuesChange(newValues);
                            }}
                        />
                        <label htmlFor={`answer-${option.value}`}>{option.label}</label>
                    </div>
                ))}
            </div>
        </div>
    );
}