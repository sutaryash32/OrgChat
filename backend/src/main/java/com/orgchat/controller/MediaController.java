package com.orgchat.controller;

import com.orgchat.model.Media;
import com.orgchat.model.User;
import com.orgchat.service.MediaService;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/media")
public class MediaController {

    private final MediaService mediaService;

    public MediaController(MediaService mediaService) {
        this.mediaService = mediaService;
    }

    @PostMapping("/upload")
    public ResponseEntity<Media> uploadMedia(
            @AuthenticationPrincipal User user,
            @RequestParam("file") MultipartFile file) throws IOException {
        Media media = mediaService.upload(user.getMerID(), file);
        return ResponseEntity.ok(media);
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<InputStreamResource> downloadMedia(@PathVariable String id) throws IOException {
        Media media = mediaService.findById(id).orElse(null);
        if (media == null) {
            return ResponseEntity.notFound().build();
        }

        GridFsResource resource = mediaService.download(media.getStoragePath());
        if (resource == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(media.getFileType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + media.getFileName() + "\"")
                .body(new InputStreamResource(resource.getInputStream()));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteMedia(
            @AuthenticationPrincipal User user,
            @PathVariable String id) {
        boolean deleted = mediaService.delete(id, user.getMerID());
        return deleted ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }

    @GetMapping("/user/{merID}")
    public ResponseEntity<List<Media>> getMediaByUser(@PathVariable String merID) {
        return ResponseEntity.ok(mediaService.getMediaByUploader(merID));
    }
}
