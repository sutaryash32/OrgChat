package com.orgchat.service;

import com.orgchat.model.Media;
import com.orgchat.repository.MediaRepository;
import com.mongodb.client.gridfs.model.GridFSFile;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class MediaService {

    private final MediaRepository mediaRepository;
    private final GridFsTemplate gridFsTemplate;

    public MediaService(MediaRepository mediaRepository, GridFsTemplate gridFsTemplate) {
        this.mediaRepository = mediaRepository;
        this.gridFsTemplate = gridFsTemplate;
    }

    public Media upload(String uploaderMerID, MultipartFile file) throws IOException {
        // Store binary in GridFS
        ObjectId gridFsId = gridFsTemplate.store(
                file.getInputStream(),
                file.getOriginalFilename(),
                file.getContentType());

        // Save metadata
        Media media = Media.builder()
                .uploaderId(uploaderMerID)
                .fileName(file.getOriginalFilename())
                .fileType(file.getContentType())
                .fileSize(file.getSize())
                .storagePath(gridFsId.toHexString())
                .timestamp(Instant.now())
                .build();

        return mediaRepository.save(media);
    }

    public Optional<Media> findById(String id) {
        return mediaRepository.findById(id);
    }

    public GridFsResource download(String storagePath) {
        GridFSFile file = gridFsTemplate.findOne(
                new Query(Criteria.where("_id").is(new ObjectId(storagePath))));

        if (file == null) {
            return null;
        }

        return gridFsTemplate.getResource(file);
    }

    public boolean delete(String mediaId, String requesterMerID) {
        Optional<Media> optMedia = mediaRepository.findById(mediaId);
        if (optMedia.isEmpty()) {
            return false;
        }

        Media media = optMedia.get();

        // Only the uploader can delete
        if (!media.getUploaderId().equals(requesterMerID)) {
            return false;
        }

        // Delete from GridFS
        gridFsTemplate.delete(
                new Query(Criteria.where("_id").is(new ObjectId(media.getStoragePath()))));

        // Delete metadata
        mediaRepository.delete(media);
        return true;
    }

    public List<Media> getMediaByUploader(String uploaderMerID) {
        return mediaRepository.findByUploaderIdOrderByTimestampDesc(uploaderMerID);
    }
}
