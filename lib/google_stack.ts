import { GoogleProvider } from "@cdktf/provider-google/lib/provider"
import { GcsBackend, TerraformStack } from "cdktf"
import { Construct } from "constructs"
import { Common } from "./common"

export class GoogleStack extends TerraformStack {

    constructor(scope: Construct, id: string) {
        super(scope, id);

        new GcsBackend(this, {
            bucket: Common.get_bucket_name(),
            prefix: `${Common.get_backend_prefix()}/${id}`,
        })


        new GoogleProvider(this, "google", {
            project: Common.get_project_id(),
        })
    }
} 