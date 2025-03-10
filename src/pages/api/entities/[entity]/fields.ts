import { entitiesApiController } from "backend/entities/entities.controller";
import { requestHandler } from "backend/lib/request";

export default requestHandler({
  GET: async (getValidatedRequest) => {
    const validatedRequest = await getValidatedRequest(["entity"]);

    return await entitiesApiController.getEntityFields(validatedRequest.entity);
  },
});
