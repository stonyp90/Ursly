# =============================================================================
# URSLY Keycloak Custom Image
# =============================================================================

FROM quay.io/keycloak/keycloak:23.0 as builder

# Enable health and metrics endpoints
ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true

# Copy custom theme
COPY themes/ursly /opt/keycloak/themes/ursly

# Copy realm configuration
COPY realms /opt/keycloak/data/import

# Build optimized image
RUN /opt/keycloak/bin/kc.sh build

# =============================================================================
# Production Image
# =============================================================================

FROM quay.io/keycloak/keycloak:23.0

# Copy built artifacts from builder
COPY --from=builder /opt/keycloak/ /opt/keycloak/

# Set environment variables
ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true

# Expose port
EXPOSE 8080

# Start Keycloak
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start", "--optimized", "--import-realm"]

