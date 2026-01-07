import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';
import { WorkItemCommandExecutor } from '../../../persistence/executor/WorkItemCommandExecutor';
import { WorkItemState } from '../../../domain/workitem/WorkItemState';
import { GrpcToCommandMapper } from '../mappers/GrpcToCommandMapper';
import { CommandToGrpcMapper } from '../mappers/CommandToGrpcMapper';

/**
 * UPDATED: Works with ExecutionResult instead of CommandDecision
 */
export class WorkItemGrpcServer {
    private server: grpc.Server;

    constructor(
        private readonly port: number,
        private readonly executor: WorkItemCommandExecutor
    ) {
        this.server = new grpc.Server();
        this.setupRoutes();
    }

    public start(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.server.bindAsync(
                `0.0.0.0:${this.port}`,
                grpc.ServerCredentials.createInsecure(),
                (err, port) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    console.log(`[gRPC Server] Running on port ${port}`);
                    this.server.start();
                    resolve();
                }
            );
        });
    }

    public stop(): Promise<void> {
        return new Promise((resolve) => {
            this.server.tryShutdown(() => {
                console.log('[gRPC Server] Stopped');
                resolve();
            });
        });
    }

    private setupRoutes() {
        const protoPath = path.resolve(__dirname, '../../protos/workitem.proto');
        const packageDefinition = protoLoader.loadSync(
            protoPath,
            { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true }
        );
        const proto = grpc.loadPackageDefinition(packageDefinition) as any;

        this.server.addService(proto.workitem.v1.WorkItemService.service, {
            CreateWorkItem: this.createWorkItem.bind(this),
            ClaimWorkItem: this.claimWorkItem.bind(this),
            CompleteWorkItem: this.completeWorkItem.bind(this),
            CancelWorkItem: this.cancelWorkItem.bind(this)
        });
    }

    // ------------------------------------------------------------
    // UPDATED Handlers
    // ------------------------------------------------------------

    private async createWorkItem(call: any, callback: any) {
        try {
            const req = call.request;
            console.log('[SDK-SERVER] ========== CREATE WorkItem REQUEST Received from workitem client is ==========', call.request);

            const command = GrpcToCommandMapper.toCreateCommand(req);
            console.log('[SDK-SERVER] Mapped CreateWorkItemCommand:', command);
            const context = GrpcToCommandMapper.toContext(req, 'CREATE');
            console.log('[SDK-SERVER] Executing CreateWorkItem with command:', context);

            // CHANGED: Executor now returns ExecutionResult
            const result = await this.executor.execute(command, context as any);

            // CHANGED: Extract decision and workItemId from result
            const response = CommandToGrpcMapper.toCreateResponse(
                result.decision,
                result.workItemId || 0
            );

            callback(null, response);

        } catch (err: any) {
            callback(CommandToGrpcMapper.toGrpcError(err));
        }
    }

    private async claimWorkItem(call: any, callback: any) {
        await this.handleTransition(call, callback, 'CLAIM', WorkItemState.CLAIMED);
    }

    private async completeWorkItem(call: any, callback: any) {
        const outputJson = call.request.output_json;
        await this.handleTransition(
            call,
            callback,
            'COMPLETE',
            WorkItemState.COMPLETED,
            { outputJson }
        );
    }

    private async cancelWorkItem(call: any, callback: any) {
        const reason = call.request.reason;
        await this.handleTransition(
            call,
            callback,
            'CANCEL',
            WorkItemState.CANCELLED,
            { reason }
        );
    }

    private async handleTransition(
        call: any,
        callback: any,
        action: 'CLAIM' | 'COMPLETE' | 'CANCEL',
        targetState: WorkItemState,
        extraData: any = {}
    ) {
        try {
            const req = call.request;

            console.log(`[SDK-SERVER] ========== ${action} WorkItem REQUEST ==========`);
            console.log(`[SDK-SERVER] Raw gRPC request:`, JSON.stringify(req, null, 2));
            console.log(`[SDK-SERVER] Action: ${action}, TargetState: ${targetState}`);

            // Map gRPC request to command
            const command = GrpcToCommandMapper.toTransitionCommand(targetState, req, extraData);
            console.log('[SDK-SERVER] Mapped TransitionCommand:', JSON.stringify(command, null, 2));

            // Map to validation context
            const context = GrpcToCommandMapper.toContext(req, action, targetState);
            console.log('[SDK-SERVER] Validation Context:', JSON.stringify(context, null, 2));

            console.log('[SDK-SERVER] Calling executor.execute()...');

            // Execute command through framework
            const result = await this.executor.execute(command, context as any);

            console.log('[SDK-SERVER] Executor result:', JSON.stringify(result, null, 2));

            // Map result to gRPC response
            const response = CommandToGrpcMapper.toTransitionResponse(
                result.decision,
                result.workItemId || req.work_item_id
            );

            console.log('[SDK-SERVER] Mapped gRPC response:', JSON.stringify(response, null, 2));
            console.log(`[SDK-SERVER] ========== ${action} WorkItem COMPLETE ==========\n`);

            callback(null, response);

        } catch (err: any) {
            console.error(`[SDK-SERVER] ========== ${action} WorkItem ERROR ==========`);
            console.error('[SDK-SERVER] Error:', err);
            console.error('[SDK-SERVER] Error stack:', err.stack);
            console.error(`[SDK-SERVER] ========== ERROR END ==========\n`);
            callback(CommandToGrpcMapper.toGrpcError(err));
        }
    }
}
