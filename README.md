# GKE構築用 cdktf

+ クラスタ作成

    cdktf deploy cluster

+ ノードプール

    cdktf deploy nodepool

+ ワークロード

    cdktf deploy workload

+ NVIDIA DCGM Exporter

    cdktf deploy dcgm

# 開発環境

> docker-compose up -d

上記の後、環境内で下記のシェルスクリプトを実行してください

> sh after_install.sh

実行前に「.env」を準備してください。

下記でterraformコードが「cdktf.out」に生成されます

> cdktf synth

# 運用

## kubectlで接続

kubectl でコントロールできるように設定
```
gcloud container clusters get-credentials クラスタ名 --zone ゾーン名 --project プロジェクト名
```

## POD稼働状況
kubectl get pods

↑名前空間：defaultのみ

下記で全部のnamespaceを対象にする  
```
--all-namespaces  
もしくは  
-A  
```

## スケーリング設定

> kubectl scale deployment サービス名 --replicas=0

