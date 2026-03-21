package com.orgchat.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MultiMessageRequest {

    @NotEmpty(message = "At least one recipient is required")
    private List<String> recipientIds;

    private String content;

    private String mediaId;
}
