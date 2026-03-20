package com.orgchat.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "media")
public class Media {

    @Id
    private String id;

    private String uploaderId;    // merID of uploader

    private String fileName;

    private String fileType;      // MIME type (image/png, video/mp4, etc.)

    private long fileSize;        // bytes

    private String storagePath;   // GridFS file ID or cloud storage path

    @Builder.Default
    private Instant timestamp = Instant.now();

    private Instant expiry;       // Optional auto-delete time
}
