package com.orgchat.service;

import com.orgchat.model.Media;
import com.orgchat.repository.MediaRepository;
import com.mongodb.client.gridfs.model.GridFSFile;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class MediaService {

    private static final Logger log = LoggerFactory.getLogger(MediaService.class);

    private final MediaRepository mediaRepository;
    private final GridFsTemplate gridFsTemplate;

    public MediaService(MediaRepository mediaRepository, GridFsTemplate gridFsTemplate) {
        this.mediaRepository = mediaRepository;
        this.gridFsTemplate = gridFsTemplate;
    }

    public Media upload(String uploaderMerID, MultipartFile file) throws IOException {
        log.info("Media upload started — user: '{}', file: '{}', type: {}, size: {} bytes",
                uploaderMerID, file.getOriginalFilename(), file.getContentType(), file.getSize());

        if (file.isEmpty()) {
            log.error("Upload failed — empty file from user: {}", uploaderMerID);
            throw new IllegalArgumentException("Cannot upload an empty file");
        }

        // Store binary in GridFS
        ObjectId gridFsId;
        try {
            gridFsId = gridFsTemplate.store(
                    file.getInputStream(),
                    file.getOriginalFilename(),
                    file.getContentType());
            log.info("File stored in GridFS with id: {}", gridFsId.toHexString());
        } catch (Exception e) {
            log.error("GridFS storage failed for file '{}': {}", file.getOriginalFilename(), e.getMessage(), e);
            throw new RuntimeException("Failed to store file in GridFS: " + e.getMessage());
        }

        // Save metadata
        Media media = Media.builder()
                .uploaderId(uploaderMerID)
                .fileName(file.getOriginalFilename())
                .fileType(file.getContentType())
                .fileSize(file.getSize())
                .storagePath(gridFsId.toHexString())
                .timestamp(Instant.now())
                .build();

        Media saved = mediaRepository.save(media);
        log.info("Media metadata saved — id: {}, file: '{}', uploader: '{}'",
                saved.getId(), saved.getFileName(), uploaderMerID);

        return saved;
    }

    public Optional<Media> findById(String id) {
        log.debug("Looking up media by id: {}", id);
        Optional<Media> media = mediaRepository.findById(id);
        if (media.isEmpty()) {
            log.warn("Media not found: {}", id);
        }
        return media;
    }

    public GridFsResource download(String storagePath) {
        log.info("Downloading file from GridFS, storagePath: {}", storagePath);

        try {
            GridFSFile file = gridFsTemplate.findOne(
                    new Query(Criteria.where("_id").is(new ObjectId(storagePath))));

            if (file == null) {
                log.warn("GridFS file not found for storagePath: {}", storagePath);
                return null;
            }

            log.debug("GridFS file found: {}", file.getFilename());
            return gridFsTemplate.getResource(file);
        } catch (Exception e) {
            log.error("GridFS download failed for storagePath '{}': {}", storagePath, e.getMessage(), e);
            return null;
        }
    }

    public boolean delete(String mediaId, String requesterMerID) {
        log.info("Delete requested — mediaId: {}, requester: '{}'", mediaId, requesterMerID);

        Optional<Media> optMedia = mediaRepository.findById(mediaId);
        if (optMedia.isEmpty()) {
            log.warn("Delete failed — media not found: {}", mediaId);
            return false;
        }

        Media media = optMedia.get();

        // Only the uploader can delete
        if (!media.getUploaderId().equals(requesterMerID)) {
            log.warn("Delete denied — requester '{}' is not the uploader '{}' for media: {}",
                    requesterMerID, media.getUploaderId(), mediaId);
            return false;
        }

        try {
            // Delete from GridFS
            gridFsTemplate.delete(
                    new Query(Criteria.where("_id").is(new ObjectId(media.getStoragePath()))));
            log.info("GridFS file deleted: {}", media.getStoragePath());
        } catch (Exception e) {
            log.error("GridFS delete failed for storagePath '{}': {}", media.getStoragePath(), e.getMessage(), e);
        }

        // Delete metadata
        mediaRepository.delete(media);
        log.info("Media deleted successfully — id: {}, file: '{}', by: '{}'",
                mediaId, media.getFileName(), requesterMerID);
        return true;
    }

    public List<Media> getMediaByUploader(String uploaderMerID) {
        log.debug("Fetching media for uploader: '{}'", uploaderMerID);
        List<Media> media = mediaRepository.findByUploaderIdOrderByTimestampDesc(uploaderMerID);
        log.debug("Found {} media files for uploader: '{}'", media.size(), uploaderMerID);
        return media;
    }
}
