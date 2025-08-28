import { readJsonFile, writeJsonFile } from '../utils/jsonDb';
import { v4 as uuidv4 } from 'uuid';

interface Visitor {
  id: string;
  visitorName: string;
  sabbathDate: string;
  notes: string;
}

export default defineEventHandler(async (event) => {
  const visitors: Visitor[] = await readJsonFile('visitors.json');

  // GET /api/visitors - Get visitors by date
  if (event.node.req.method === 'GET') {
    const query = getQuery(event);
    const sabbathDate = query.sabbathDate as string;
    if (sabbathDate) {
      return visitors.filter(visitor => visitor.sabbathDate === sabbathDate);
    }
    return visitors; // Return all if no date specified
  }

  // POST /api/visitors - Add a new visitor
  if (event.node.req.method === 'POST') {
    const body = await readBody(event);
    const newVisitor: Visitor = {
      id: uuidv4(),
      visitorName: body.visitorName,
      sabbathDate: body.sabbathDate,
      notes: body.notes || '',
    };
    visitors.push(newVisitor);
    await writeJsonFile('visitors.json', visitors);
    return newVisitor;
  }

  // PUT /api/visitors/:id - Update an existing visitor
  if (event.node.req.method === 'PUT') {
    const visitorId = event.context.params?.id;
    const body = await readBody(event);
    const index = visitors.findIndex(v => v.id === visitorId);
    if (index !== -1) {
      visitors[index] = { ...visitors[index], ...body };
      await writeJsonFile('visitors.json', visitors);
      return visitors[index];
    }
    throw createError({ statusCode: 404, statusMessage: 'Visitor not found' });
  }

  // DELETE /api/visitors/:id - Delete a visitor
  if (event.node.req.method === 'DELETE') {
    const visitorId = event.context.params?.id;
    const initialLength = visitors.length;
    const updatedVisitors = visitors.filter(v => v.id !== visitorId);
    if (updatedVisitors.length < initialLength) {
      await writeJsonFile('visitors.json', updatedVisitors);
      return { message: 'Visitor deleted successfully' };
    }
    throw createError({ statusCode: 404, statusMessage: 'Visitor not found' });
  }
});
