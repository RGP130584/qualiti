import { EventEmitter } from 'events';
import pool from '../db';

class EventBus extends EventEmitter {
  async publish(eventName: string, payload: any): Promise<void> {
    const client = await pool.connect();
    try {
      // 1. Log the event firing in event_logs
      await client.query(
        'INSERT INTO event_logs (event_name, payload, status) VALUES ($1, $2, $3)',
        [eventName, JSON.stringify(payload), 'success']
      );

      // 2. Emit the event locally in memory (asynchronous/non-blocking)
      setImmediate(() => {
        this.emit(eventName, payload);
      });
    } catch (err) {
      console.error(`[EventBus] Error logging event ${eventName}:`, err);
    } finally {
      client.release();
    }
  }

  async sendToDlq(eventName: string, payload: any, errorMessage: string): Promise<void> {
    const client = await pool.connect();
    try {
      console.warn(`[EventBus] Event ${eventName} failed. Storing in Dead Letter Queue.`);
      await client.query(
        'INSERT INTO event_dlq (event_name, payload, error_message, attempts, status) VALUES ($1, $2, $3, 1, $4)',
        [eventName, JSON.stringify(payload), errorMessage, 'pending']
      );
    } catch (err) {
      console.error(`[EventBus] Error writing to DLQ:`, err);
    } finally {
      client.release();
    }
  }

  // Admin replay functionality
  async replayEvent(dlqId: number): Promise<boolean> {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM event_dlq WHERE id = $1 AND status = $2', [dlqId, 'pending']);
      if (res.rows.length === 0) return false;

      const dlqItem = res.rows[0];
      const payload = dlqItem.payload;

      console.log(`[EventBus] Replaying event #${dlqId} (${dlqItem.event_name})`);

      try {
        // Emit again to invoke all handlers
        this.emit(dlqItem.event_name, payload);

        // Update DLQ status to resolved
        await client.query(
          "UPDATE event_dlq SET status = $1, attempts = attempts + 1 WHERE id = $2",
          ['resolved', dlqId]
        );
        return true;
      } catch (err: any) {
        // Update DLQ attempts count
        await client.query(
          "UPDATE event_dlq SET error_message = $1, attempts = attempts + 1 WHERE id = $2",
          [err.message, dlqId]
        );
        return false;
      }
    } finally {
      client.release();
    }
  }
}

export const eventBus = new EventBus();
