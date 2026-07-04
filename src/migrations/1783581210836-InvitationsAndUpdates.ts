import { MigrationInterface, QueryRunner } from "typeorm";

export class InvitationsAndUpdates1783581210836 implements MigrationInterface {
    name = 'InvitationsAndUpdates1783581210836'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "invitations" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "email" character varying(255) NOT NULL, "token_hash" character(60) NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "accepted_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "business_id" integer NOT NULL, "invited_by" integer NOT NULL, "role_id" smallint NOT NULL, CONSTRAINT "UQ_e931a1da2f1daf11b0e7341a8f0" UNIQUE ("business_id", "email"), CONSTRAINT "PK_5dec98cfdfd562e4ad3648bbb07" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "roles" ADD "is_system" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "business" ALTER COLUMN "vat_number" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "business" ALTER COLUMN "tl_number" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "invitations" ADD CONSTRAINT "FK_be94701bb578db1a8a295e6f7e8" FOREIGN KEY ("business_id") REFERENCES "business"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invitations" ADD CONSTRAINT "FK_29b1cef6891d9b9d4e35f793b81" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invitations" ADD CONSTRAINT "FK_e4950c4d6aa2236f5213538e01a" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invitations" DROP CONSTRAINT "FK_e4950c4d6aa2236f5213538e01a"`);
        await queryRunner.query(`ALTER TABLE "invitations" DROP CONSTRAINT "FK_29b1cef6891d9b9d4e35f793b81"`);
        await queryRunner.query(`ALTER TABLE "invitations" DROP CONSTRAINT "FK_be94701bb578db1a8a295e6f7e8"`);
        await queryRunner.query(`ALTER TABLE "business" ALTER COLUMN "tl_number" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "business" ALTER COLUMN "vat_number" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "is_system"`);
        await queryRunner.query(`DROP TABLE "invitations"`);
    }

}
