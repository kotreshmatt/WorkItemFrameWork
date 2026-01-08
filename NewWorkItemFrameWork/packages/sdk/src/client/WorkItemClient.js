"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkItemClient = void 0;
const grpc = __importStar(require("@grpc/grpc-js"));
const protoLoader = __importStar(require("@grpc/proto-loader"));
const events_1 = require("events");
const path = __importStar(require("path"));
class WorkItemClient extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        // Load Proto
        const protoPath = path.resolve(__dirname, '../../protos/workitem.proto');
        const packageDefinition = protoLoader.loadSync(protoPath, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true });
        const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
        this.protoPackage = protoDescriptor.workitem.v1;
        // Create Generic Client
        const Service = this.protoPackage.WorkItemService;
        this.client = new Service(config.address, config.credentials || grpc.credentials.createInsecure());
        console.log('[SDK-CLIENT] gRPC client methods:', Object.keys(this.client));
    }
    // ------------------------------------------------------------
    // Public API
    // ------------------------------------------------------------
    /**
     * Create a new WorkItem
     */
    async createWorkItem(params) {
        console.log('[SDK-CLIENT] ========== CREATE WorkItem REQUEST ==========', params);
        const request = {
            workflow_id: params.workflowId,
            run_id: params.runId,
            task_type: params.taskType,
            task_name: params.taskName,
            description: params.description,
            priority: params.priority,
            assignment_spec: {
                candidate_users: params.assignmentSpec.candidateUsers || [],
                candidate_groups: params.assignmentSpec.candidateGroups || [],
                candidate_positions: params.assignmentSpec.candidatePositions || [],
                candidate_org_units: params.assignmentSpec.candidateOrgUnits || [],
                strategy: params.assignmentSpec.strategy,
                mode: params.assignmentSpec.mode,
                separation_of_duties_key: params.assignmentSpec.separationOfDutiesKey
            },
            lifecycle: params.lifecycle,
            initiated_by: params.initiatedBy,
            initiated_at: (params.initiatedAt || new Date()).toISOString(),
            parameters: (params.parameters || []).map(p => ({
                name: p.name,
                direction: p.direction,
                mandatory: p.mandatory || false,
                value: p.value != null ? JSON.stringify(p.value) : null
            })),
            context_data: params.contextData ? JSON.stringify(params.contextData) : undefined,
            due_date: params.dueDate?.toISOString(),
            distribution_strategy: params.distributionStrategy || params.assignmentSpec.strategy,
            distribution_mode: params.distributionMode || params.assignmentSpec.mode,
            context: {
                actor_id: params.actorId || params.initiatedBy,
                idempotency_key: params.idempotencyKey
            }
        };
        console.log('[SDK-CLIENT] gRPC request to be sent:', JSON.stringify(request, null, 2));
        return this.invokeRpc('CreateWorkItem', request);
    }
    /**
     * Claim a WorkItem
     */
    async claimWorkItem(params) {
        console.log('[SDK-CLIENT] ========== CLAIM WorkItem REQUEST ==========');
        console.log('[SDK-CLIENT] Input params:', JSON.stringify(params, null, 2));
        const request = {
            work_item_id: params.workItemId,
            context: {
                actor_id: params.actorId,
                idempotency_key: params.idempotencyKey
            }
        };
        console.log('[SDK-CLIENT] gRPC request object:', JSON.stringify(request, null, 2));
        console.log('[SDK-CLIENT] Calling gRPC method: claimWorkItem');
        const response = await this.invokeRpc('claimWorkItem', request);
        console.log('[SDK-CLIENT] gRPC response received:', JSON.stringify(response, null, 2));
        console.log('[SDK-CLIENT] ========== CLAIM WorkItem COMPLETE ==========\n');
        return response;
    }
    /**
     * Complete a WorkItem
     */
    async completeWorkItem(params) {
        const request = {
            work_item_id: params.workItemId,
            output_json: JSON.stringify(params.output),
            context: {
                actor_id: params.actorId,
                idempotency_key: params.idempotencyKey
            }
        };
        return this.invokeRpc('CompleteWorkItem', request);
    }
    /**
     * Cancel a WorkItem
     */
    async cancelWorkItem(params) {
        const request = {
            work_item_id: params.workItemId,
            reason: params.reason,
            context: {
                actor_id: params.actorId,
                idempotency_key: params.idempotencyKey
            }
        };
        return this.invokeRpc('CancelWorkItem', request);
    }
    // ------------------------------------------------------------
    // Helper
    // ------------------------------------------------------------
    invokeRpc(method, request) {
        return new Promise((resolve, reject) => {
            this.client[method](request, (err, response) => {
                if (err) {
                    return reject(err);
                }
                resolve({
                    accepted: response.accepted,
                    workItemId: response.work_item_id,
                    state: response.state,
                    error: response.message
                });
            });
        });
    }
}
exports.WorkItemClient = WorkItemClient;
//# sourceMappingURL=WorkItemClient.js.map