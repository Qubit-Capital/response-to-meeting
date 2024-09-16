export interface Email {
    _id: { $oid: string };
    from_email: string;
    subject: string;
    to_email: string;
    to_name: string;
    event_timestamp: string;
    campaign_name: string;
    campaign_id: { $numberInt: string };
    sent_message_text: string;
    reply_message_text: string;
    time_replied: string;
    status: string;
    category?: {
        id: string;
        name: string;
    };
}