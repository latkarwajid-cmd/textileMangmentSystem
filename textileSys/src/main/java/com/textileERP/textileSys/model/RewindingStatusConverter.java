package com.textileERP.textileSys.model;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class RewindingStatusConverter implements AttributeConverter<RewindingStatus, String> {
    @Override
    public String convertToDatabaseColumn(RewindingStatus status) {
        return status == null ? RewindingStatus.ISSUED.name() : status.name();
    }

    @Override
    public RewindingStatus convertToEntityAttribute(String value) {
        if (value == null || value.isBlank() || "ACTIVE".equalsIgnoreCase(value)) {
            return RewindingStatus.ISSUED;
        }
        return RewindingStatus.valueOf(value.toUpperCase());
    }
}
