import React from 'react';
import { InstructionTemplate } from '@/models/InstructionTemplate';

interface InstructionTemplateListProps {
  templates: InstructionTemplate[];
}

const InstructionTemplateList: React.FC<InstructionTemplateListProps> = ({ templates }) => {
  return (
    <div className="space-y-4">
      {templates.map((template) => (
        <div key={template._id.$oid} className="border p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">{template.category.name} - {template.user_need.name}</h2>
          <p className="text-sm text-gray-600 mb-2">{template.user_need.description}</p>
          <p className="text-sm">{template.template}</p>
        </div>
      ))}
    </div>
  );
};

export default InstructionTemplateList;