import { RadioGroup, RadioGroupItem } from '@/app/_components/ui/radio-group';
import { Option } from './types';

interface SingleChoiceAnswerProps {
    options: Option[];
    value: string;
    onValueChange: (value: string) => void;
}

export default function SingleChoiceAnswer({ 
    options, 
    value, 
    onValueChange 
}: SingleChoiceAnswerProps) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">
                正确答案 <span className="text-red-500">*</span>
            </label>
            <RadioGroup
                value={value}
                onValueChange={onValueChange}
                className="space-y-2"
            >
                {options.map((option: Option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={`answer-${option.value}`} />
                        <label htmlFor={`answer-${option.value}`}>{option.label}</label>
                    </div>
                ))}
            </RadioGroup>
        </div>
    );
}