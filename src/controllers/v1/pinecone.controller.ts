import type { RouteHandler } from "../../types/express";
import { EmbeddingService } from "../../services/v1/embedding.service";
import { ApiResponse } from "../../utils/apiResponse";
import logger from "../../utils/logger";
import { z } from "zod";

const bulkIngestSchema = z.object({
  collection: z.enum(["projects", "fundraisers", "donations"])
});

const singleIngestSchema = z.object({
  collection: z.enum(["projects", "fundraisers", "donations"]),
  id: z.string()
});

const deleteSchema = z.object({
  collection: z.string().optional(),
  id: z.string().optional()
}).refine(data => data.collection || data.id, {
  message: "Must provide either collection or id to delete"
});

export const PineconeController = {
  /**
   * POST /api/v1/pinecone/ingest/bulk
   * Bulk ingest an entire collection (Runs in background)
   */
  bulkIngest: <RouteHandler>(async (req, res, next) => {
    try {
      const validation = bulkIngestSchema.safeParse(req.body);
      if (!validation.success) {
        return ApiResponse.validationError(res, validation.error.flatten());
      }

      const { collection } = validation.data;
      
      // Fire and forget - runs in background
      EmbeddingService.bulkIngestCollection(req.db, collection).catch(err => {
        logger.error(`Background bulk ingest failed for ${collection}: ${err.message}`);
      });

      return ApiResponse.success(res, {
        message: `Bulk ingestion for ${collection} started in the background.`,
      }, 202); // 202 Accepted
    } catch (error: any) {
      logger.error(`Bulk ingest API error: ${error.message}`);
      return ApiResponse.error(res, "Failed to start bulk ingestion", 500);
    }
  }),

  /**
   * POST /api/v1/pinecone/ingest/single
   * Ingest a single document
   */
  singleIngest: <RouteHandler>(async (req, res, next) => {
    try {
      const validation = singleIngestSchema.safeParse(req.body);
      if (!validation.success) {
        return ApiResponse.validationError(res, validation.error.flatten());
      }

      const { collection, id } = validation.data;
      
      await EmbeddingService.ingestSingleDocument(req.db, collection, id);

      return ApiResponse.success(res, {
        message: `Document ${id} from ${collection} ingested successfully.`,
      });
    } catch (error: any) {
      logger.error(`Single ingest API error: ${error.message}`);
      return ApiResponse.error(res, error.message || "Failed to ingest document", 500);
    }
  }),

  /**
   * DELETE /api/v1/pinecone/data
   * Delete data from pinecone by collection or id
   */
  deleteData: <RouteHandler>(async (req, res, next) => {
    try {
      const validation = deleteSchema.safeParse(req.body);
      if (!validation.success) {
        return ApiResponse.validationError(res, validation.error.flatten());
      }

      const { collection, id } = validation.data;
      
      await EmbeddingService.deleteFromPinecone(collection, id);

      return ApiResponse.success(res, {
        message: `Data deleted successfully.`,
      });
    } catch (error: any) {
      logger.error(`Delete pinecone data error: ${error.message}`);
      return ApiResponse.error(res, error.message || "Failed to delete data", 500);
    }
  }),
};
