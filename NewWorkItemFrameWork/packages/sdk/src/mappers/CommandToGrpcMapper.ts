import * as grpc from '@grpc/grpc-js';
import { CommandDecision } from '../../../domain/workitem/results/CommandDecision';

/**
 * CommandToGrpcMapper
 * Maps internal Framework command results to gRPC Proto responses
 */
export class CommandToGrpcMapper {

    /**
     * Map CREATE command result to gRPC response
     */
    static toCreateResponse(
        result: CommandDecision,
        workItemId: number
    ): any {
        return {
            accepted: result.accepted,
            message: result.accepted
                ? 'WorkItem created successfully'
                : result.validationResult?.reason || 'Command rejected',
            work_item_id: workItemId,
            state: result.initialState || 'UNKNOWN'
        };
    }

    /**
     * Map TRANSITION command result to gRPC response
     */
    static toTransitionResponse(
        result: CommandDecision,
        workItemId: number
    ): any {
        return {
            accepted: result.accepted,
            message: result.accepted
                ? 'WorkItem transitioned successfully'
                : result.validationResult?.reason || 'Command rejected',
            work_item_id: workItemId,
            state: result.toState || result.fromState || 'UNKNOWN'
        };
    }

    /**
     * Map error to gRPC error with proper status code
     */
    static toGrpcError(error: Error, code: grpc.status = grpc.status.INTERNAL): any {
        // Map known error types to gRPC status codes
        let statusCode = code;

        if (error.message.includes('not found')) {
            statusCode = grpc.status.NOT_FOUND;
        } else if (error.message.includes('duplicate')) {
            statusCode = grpc.status.ALREADY_EXISTS;
        } else if (error.message.includes('unauthorized') || error.message.includes('permission')) {
            statusCode = grpc.status.PERMISSION_DENIED;
        } else if (error.message.includes('invalid')) {
            statusCode = grpc.status.INVALID_ARGUMENT;
        }

        return {
            code: statusCode,
            details: error.message,
            metadata: new grpc.Metadata()
        };
    }
}
