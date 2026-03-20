package com.orgchat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationSummary {
    private String partnerMerID;
    private String partnerDisplayName;
    private String partnerAvatarUrl;
    private String lastMessage;
    private String lastMediaId;
    private Instant lastTimestamp;
    private long unreadCount;
}
