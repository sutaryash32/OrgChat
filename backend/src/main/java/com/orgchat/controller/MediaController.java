package com.orgchat.controller;

import com.orgchat.model.Media;
import com.orgchat.service.MediaService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/media")
public class MediaController {

    private static final Logger log = LoggerFactory.getLogger(MediaController.class);

    private final MediaService mediaService;

    public MediaController(MediaService mediaService) {
        this.mediaService = mediaService;
    }

    @PostMapping("/upload")
    public ResponseEntity<Media> uploadMedia(
            Principal principal,
            @RequestParam("file") MultipartFile file) throws IOException {
        String merID = principal.getName();
        log.info("POST /api/media/upload — user: '{}', file: '{}', size: {} bytes",
                merID, file.getOriginalFilename(), file.getSize());
        try {
            Media media = mediaService.upload(merID, file);
            log.info("Upload complete — media id: {}", media.getId());
            return ResponseEntity.ok(media);
        } catch (Exception e) {
            log.error("Upload failed for user '{}', file '{}': {}",
                    merID, file.getOriginalFilename(), e.getMessage(), e);
            throw e;
        }
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<InputStreamResource> downloadMedia(@PathVariable String id) throws IOException {
        log.info("GET /api/media/download/{}", id);
        Media media = mediaService.findById(id).orElse(null);
        if (media == null) {
            log.warn("Download failed — media not found: {}", id);
            return ResponseEntity.notFound().build();
        }

        GridFsResource resource = mediaService.download(media.getStoragePath());
        if (resource == null) {
            log.error("Download failed — GridFS resource not found for media: {} (storagePath: {})",
                    id, media.getStoragePath());
            return ResponseEntity.notFound().build();
        }

        log.info("Serving file download: '{}' ({}, {} bytes)", media.getFileName(), media.getFileType(), media.getFileSize());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(media.getFileType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + media.getFileName() + "\"")
                .body(new InputStreamResource(resource.getInputStream()));
    }

    @GetMapping("/info/{id}")
    public ResponseEntity<Media> getMediaInfo(@PathVariable String id) {
        log.info("GET /api/media/info/{}", id);
        return mediaService.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> {
                    log.warn("Media metadata not found: {}", id);
                    return ResponseEntity.notFound().build();
                });
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteMedia(
            Principal principal,
            @PathVariable String id) {
        String merID = principal.getName();
        log.info("DELETE /api/media/delete/{} — requester: '{}'", id, merID);
        boolean deleted = mediaService.delete(id, merID);
        if (deleted) {
            log.info("Media deleted: {}", id);
            return ResponseEntity.ok().build();
        } else {
            log.warn("Media delete denied or not found: {} (requester: '{}')", id, merID);
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/user/{merID}")
    public ResponseEntity<List<Media>> getMediaByUser(@PathVariable String merID) {
        log.info("GET /api/media/user/{}", merID);
        List<Media> media = mediaService.getMediaByUploader(merID);
        log.info("Returning {} media files for user: '{}'", media.size(), merID);
        return ResponseEntity.ok(media);
    }
}
