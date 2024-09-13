export interface InstructionTemplate {
    _id: { $oid: string };
    category_id: { $oid: string };
    user_need_id: { $oid: string };
    template: string;
    created_at: { $date: { $numberLong: string } };
    updated_at: { $date: { $numberLong: string } };
    category: {
      _id: { $oid: string };
      name: string;
      description: string;
      is_custom: boolean;
    };
    user_need: {
      _id: { $oid: string };
      category_id: { $oid: string };
      name: string;
      description: string;
      is_custom: boolean;
    };
  }