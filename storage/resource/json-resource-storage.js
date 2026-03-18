const fs = require('fs');
const path = require('path');
const { RESOURCE_ENTITY_TYPES, STORAGE_SCHEMA_VERSION } = require('../shared/constants');

class JsonResourceStorage {
  constructor(options) {
    this.layout = options.layout;
  }

  ensureStructure() {
    fs.mkdirSync(this.layout.resourcesDir, { recursive: true });

    for (const entityType of RESOURCE_ENTITY_TYPES) {
      fs.mkdirSync(path.join(this.layout.resourcesDir, entityType), {
        recursive: true,
      });
    }

    if (!fs.existsSync(this.layout.resourceManifestPath)) {
      fs.writeFileSync(
        this.layout.resourceManifestPath,
        JSON.stringify(
          {
            schemaVersion: STORAGE_SCHEMA_VERSION,
            entityTypes: RESOURCE_ENTITY_TYPES,
            note: 'Bootstrap manifest for JSON resource storage. Secret raw values must not be persisted as ordinary resource fields.',
          },
          null,
          2,
        ),
      );
    }
  }

  getEntityPath(entityType, entityId) {
    if (!RESOURCE_ENTITY_TYPES.includes(entityType)) {
      throw new Error(`Unsupported resource entity type: ${entityType}`);
    }

    return path.join(this.layout.resourcesDir, entityType, `${entityId}.json`);
  }

  save(entityType, entity) {
    if (!entity || !entity.id) {
      throw new Error('Resource entity must include an id field.');
    }

    const entityPath = this.getEntityPath(entityType, entity.id);
    fs.writeFileSync(entityPath, JSON.stringify(entity, null, 2));
    return entityPath;
  }

  read(entityType, entityId) {
    const entityPath = this.getEntityPath(entityType, entityId);
    if (!fs.existsSync(entityPath)) {
      return null;
    }

    return JSON.parse(fs.readFileSync(entityPath, 'utf8'));
  }
}

module.exports = {
  JsonResourceStorage,
};
