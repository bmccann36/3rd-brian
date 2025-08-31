import { FastifyInstance, FastifyPluginOptions } from "fastify";

interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  createdAt: string;
}

const itemSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    description: { type: "string" },
    price: { type: "number" },
    createdAt: { type: "string" },
  },
  required: ["id", "name", "description", "price", "createdAt"],
};

const createItemSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    description: { type: "string" },
    price: { type: "number" },
  },
  required: ["name", "description", "price"],
};

const updateItemSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    description: { type: "string" },
    price: { type: "number" },
  },
};

const errorSchema = {
  type: "object",
  properties: {
    error: { type: "string" },
    statusCode: { type: "number" },
  },
};

const items: Item[] = [
  {
    id: "1",
    name: "Sample Item 1",
    description: "This is the first sample item",
    price: 19.99,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Sample Item 2",
    description: "This is the second sample item",
    price: 29.99,
    createdAt: "2024-01-02T00:00:00Z",
  },
];

export default async function itemRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.get(
    "/items",
    {
      schema: {
        description: "Get all items",
        tags: ["Items"],
        response: {
          200: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: itemSchema,
              },
              count: { type: "number" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      return {
        items,
        count: items.length,
      };
    },
  );

  fastify.get<{
    Params: { id: string };
  }>(
    "/items/:id",
    {
      schema: {
        description: "Get an item by ID",
        tags: ["Items"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        response: {
          200: itemSchema,
          404: errorSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const item = items.find((i) => i.id === id);

      if (!item) {
        reply.code(404);
        return {
          error: "Item not found",
          statusCode: 404,
        };
      }

      return item;
    },
  );

  fastify.post<{
    Body: Omit<Item, "id" | "createdAt">;
  }>(
    "/items",
    {
      schema: {
        description: "Create a new item",
        tags: ["Items"],
        body: createItemSchema,
        response: {
          201: itemSchema,
        },
      },
    },
    async (request, reply) => {
      const newItem: Item = {
        ...request.body,
        id: String(items.length + 1),
        createdAt: new Date().toISOString(),
      };

      items.push(newItem);
      reply.code(201);
      return newItem;
    },
  );

  fastify.put<{
    Params: { id: string };
    Body: Partial<Omit<Item, "id" | "createdAt">>;
  }>(
    "/items/:id",
    {
      schema: {
        description: "Update an item by ID",
        tags: ["Items"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        body: updateItemSchema,
        response: {
          200: itemSchema,
          404: errorSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const itemIndex = items.findIndex((i) => i.id === id);

      if (itemIndex === -1) {
        reply.code(404);
        return {
          error: "Item not found",
          statusCode: 404,
        };
      }

      items[itemIndex] = {
        ...items[itemIndex],
        ...request.body,
      };

      return items[itemIndex];
    },
  );

  fastify.delete<{
    Params: { id: string };
  }>(
    "/items/:id",
    {
      schema: {
        description: "Delete an item by ID",
        tags: ["Items"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
              item: itemSchema,
            },
          },
          404: errorSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const itemIndex = items.findIndex((i) => i.id === id);

      if (itemIndex === -1) {
        reply.code(404);
        return {
          error: "Item not found",
          statusCode: 404,
        };
      }

      const deletedItem = items.splice(itemIndex, 1)[0];
      return {
        message: "Item deleted successfully",
        item: deletedItem,
      };
    },
  );
}
