import 'dotenv/config'

export class Common {
    // =====汎用設定=====

    /**
     * GCPのプロジェクトIDを取得する
     */
    static get_project_id() {
        return process.env.project_id!
    }

    /**
     * GCPのロケーションを取得する
     */
    static get_location() {
        return process.env.location!
    }

    /**
     * GCPのリージョンを取得する
     */
    static get_region() {
        return process.env.region!
    }

    /**
     * GCPのネットワークを取得する
     */
    static get_network() {
        return process.env.network || ""
    }

    /**
     * GCPのサブネットワークを取得する
     */
    static get_subnetwork() {
        return process.env.subnetwork || ""
    }

    /**
     * GCPのリソースラベルを取得する
     */
    static get_resource_labels() {
        return process.env.resource_labels || ""
    }

    /**
     * terraformの状態を保存するバケット名を取得する
     * @returns 
     */
    static get_bucket_name() {
        return process.env.bucket_name!
    }

    /**
     * terraformの状態を保存するGCSへのプレフィックスを取得する
     * @returns 
     */
    static get_backend_prefix() {
        return process.env.backend_prefix!
    }

    /**
     * クラスタ名を取得する
     */
    static get_cluster() {
        return process.env.cluster!
    }

    /**
     * コンテナイメージを取得する(軽め想定)
     * @returns 
     */
    static get_container_image1(): string {
        return process.env.container_image1!
    }

    /**
     * コンテナイメージを取得する(重め想定)
     * @returns 
     */
    static get_container_image2(): string {
        return process.env.container_image2!
    }

    static get_enable_ips(): string[] {
        return process.env.enable_ips!.split("|")
    }

    static get_api_url(): string {
        return process.env.API_URL!
    }

}