package com.orgchat.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "messages")
@CompoundIndex(name = "conversation_idx", def = "{'senderId': 1, 'recipientId': 1, 'timestamp': -1}")
public class Message {

    @Id
    private String id;

    private String senderId;      // merID of sender

    private String recipientId;   // merID of recipient

    private String content;       // Text content

    private String mediaId;       // Optional — reference to Media document

    @Builder.Default
    private Instant timestamp = Instant.now();

    @Builder.Default
    private boolean read = false;

    @Builder.Default
    private boolean isEdited = false;
}
