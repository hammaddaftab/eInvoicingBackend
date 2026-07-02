import { MigrationInterface, QueryRunner } from "typeorm";

export class Core1783194902739 implements MigrationInterface {
    name = 'Core1783194902739'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "industry" ("id" smallint GENERATED ALWAYS AS IDENTITY NOT NULL, "name" character varying(100) NOT NULL, "code" character varying(10) NOT NULL, CONSTRAINT "UQ_e756cbed5e9f27221c238f11fcc" UNIQUE ("name"), CONSTRAINT "UQ_d76e293720ae8ab8fe7afffdc98" UNIQUE ("code"), CONSTRAINT "PK_fc3e38485cff79e9fbba8f13831" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."emirates_enum" AS ENUM('ABU_DHABI', 'DUBAI', 'SHARJAH', 'AJMAN', 'UMM_AL_QUWAIN', 'RAS_AL_KHAIMAH', 'FUJAIRAH')`);
        await queryRunner.query(`CREATE TABLE "business" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "name" character varying(255) NOT NULL, "vat_number" character(15), "tl_number" character varying(50), "emirate" "public"."emirates_enum" NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "industry_id" smallint, CONSTRAINT "UQ_c957d0d26fd9de613e36710e0bd" UNIQUE ("vat_number"), CONSTRAINT "UQ_b6650bb5341ab29e633cc3ded3a" UNIQUE ("tl_number"), CONSTRAINT "PK_0bd850da8dafab992e2e9b058e5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "name" character varying(100) NOT NULL, "email" character varying(255) NOT NULL, "phone" character varying(15) NOT NULL, "password" character(60) NOT NULL, "is_phone_verified" boolean NOT NULL DEFAULT false, "is_email_verified" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "business_id" integer, "created_by" integer, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE ("phone"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_roles" ("user_id" integer NOT NULL, "role_id" smallint NOT NULL, "assigned_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_23ed6f04fe43066df08379fd034" PRIMARY KEY ("user_id", "role_id"))`);
        await queryRunner.query(`CREATE TABLE "roles" ("id" smallint GENERATED ALWAYS AS IDENTITY NOT NULL, "name" character varying(50) NOT NULL, "description" character varying(255), "business_id" integer, CONSTRAINT "UQ_0e74e16197c67d69c515ae3b7ec" UNIQUE ("business_id", "name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."permissions_enum" AS ENUM('READ', 'WRITE', 'DELETE', 'ALL')`);
        await queryRunner.query(`CREATE TABLE "roles_permissions" ("role_id" smallint NOT NULL, "feature_id" smallint NOT NULL, "permission" "public"."permissions_enum" NOT NULL, CONSTRAINT "PK_8713f831f04154b9f1231669c7d" PRIMARY KEY ("role_id", "feature_id"))`);
        await queryRunner.query(`CREATE TABLE "features" ("id" smallint GENERATED ALWAYS AS IDENTITY NOT NULL, "name" character varying(50) NOT NULL, "description" character varying(255), CONSTRAINT "UQ_bcc3a344ae156a9fba128e1cb4d" UNIQUE ("name"), CONSTRAINT "PK_5c1e336df2f4a7051e5bf08a941" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."otp_channel" AS ENUM('phone', 'email')`);
        await queryRunner.query(`CREATE TYPE "public"."otp_purpose" AS ENUM('signup', 'login', 'reset_password', 'update_phone', 'update_email')`);
        await queryRunner.query(`CREATE TABLE "otp_verifications" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "channel" "public"."otp_channel" NOT NULL, "destination" character varying(255) NOT NULL, "code_hash" character(60) NOT NULL, "purpose" "public"."otp_purpose" NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "attempts" smallint NOT NULL DEFAULT '0', "max_attempts" smallint NOT NULL DEFAULT '3', "verified_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" integer, CONSTRAINT "PK_91d17e75ac3182dba6701869b39" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "business" ADD CONSTRAINT "FK_d1277c8816988014f8cf9fac7b2" FOREIGN KEY ("industry_id") REFERENCES "industry"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_cde4b2aabca86cfabdc78b537f0" FOREIGN KEY ("business_id") REFERENCES "business"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_f32b1cb14a9920477bcfd63df2c" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_87b8888186ca9769c960e926870" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_b23c65e50a758245a33ee35fda1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "roles" ADD CONSTRAINT "FK_cd750f8c7a7cb867515c3bbdb91" FOREIGN KEY ("business_id") REFERENCES "business"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" ADD CONSTRAINT "FK_7d2dad9f14eddeb09c256fea719" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" ADD CONSTRAINT "FK_d2eb360911576ee270445a8c800" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "otp_verifications" ADD CONSTRAINT "FK_c7f1d281e1acc51e2a37889f5a9" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "otp_verifications" DROP CONSTRAINT "FK_c7f1d281e1acc51e2a37889f5a9"`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" DROP CONSTRAINT "FK_d2eb360911576ee270445a8c800"`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" DROP CONSTRAINT "FK_7d2dad9f14eddeb09c256fea719"`);
        await queryRunner.query(`ALTER TABLE "roles" DROP CONSTRAINT "FK_cd750f8c7a7cb867515c3bbdb91"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_b23c65e50a758245a33ee35fda1"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_87b8888186ca9769c960e926870"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_f32b1cb14a9920477bcfd63df2c"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_cde4b2aabca86cfabdc78b537f0"`);
        await queryRunner.query(`ALTER TABLE "business" DROP CONSTRAINT "FK_d1277c8816988014f8cf9fac7b2"`);
        await queryRunner.query(`DROP TABLE "otp_verifications"`);
        await queryRunner.query(`DROP TYPE "public"."otp_purpose"`);
        await queryRunner.query(`DROP TYPE "public"."otp_channel"`);
        await queryRunner.query(`DROP TABLE "features"`);
        await queryRunner.query(`DROP TABLE "roles_permissions"`);
        await queryRunner.query(`DROP TYPE "public"."permissions_enum"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP TABLE "user_roles"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "business"`);
        await queryRunner.query(`DROP TYPE "public"."emirates_enum"`);
        await queryRunner.query(`DROP TABLE "industry"`);
    }

}
