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
@Document(collection = "mate_requests")
@CompoundIndex(def = "{'fromMerID': 1, 'toMerID': 1}", unique = true)
public class MateRequest {

    @Id
    private String id;

    private String fromMerID;      // sender of the request
    private String toMerID;        // recipient of the request

    @Builder.Default
    private String status = "PENDING";   // PENDING, ACCEPTED, REJECTED

    private Instant createdAt;
    private Instant updatedAt;
}
