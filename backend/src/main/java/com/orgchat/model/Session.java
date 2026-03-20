package com.orgchat.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "sessions")
public class Session {

    @Id
    private String id;

    @Indexed
    private String userId;        // merID

    private String jwtToken;

    private Instant issuedAt;

    @Indexed(expireAfterSeconds = 0)
    private Instant expiresAt;    // MongoDB TTL — auto-deletes expired sessions
}
