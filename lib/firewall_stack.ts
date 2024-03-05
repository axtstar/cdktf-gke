import { Construct } from "constructs"

import { ComputeFirewall } from '../.gen/providers/google/compute-firewall'
import { Common } from "./common"
import { GoogleStack } from "./google_stack"

interface FirewallStackOptions {
    name: string
    priority: number
    targetTags: string[]
    allowOrDeny: { [key: string]: any }
    sourceRanges: string[]
}

export class FirewallStack extends GoogleStack {

    constructor(scope: Construct, id: string, options: FirewallStackOptions) {
        super(scope, id);

        //Firewall Resource
        new ComputeFirewall(this, id, {
            name: options.name,
            network: Common.get_network(),
            priority: options.priority,
            ...options.allowOrDeny,
            targetTags: options.targetTags,
            sourceRanges: options.sourceRanges
        })

    }
}
