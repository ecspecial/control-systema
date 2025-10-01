import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1759302540588 implements MigrationInterface {
    name = 'InitialMigration1759302540588'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'control', 'contractor', 'inspector')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "login" character varying NOT NULL, "password" character varying NOT NULL, "email" character varying NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "middleName" character varying, "phone" character varying, "role" "public"."users_role_enum" NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "organization" character varying, "department" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_2d443082eccd5198f95f2a36e2c" UNIQUE ("login"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "ttn_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "description" text, "workTypeId" character varying NOT NULL, "documents" jsonb NOT NULL DEFAULT '[]', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_06e7907a9ff3ced496d4e45fabb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."city_objects_status_enum" AS ENUM('planned', 'assigned', 'pending_activation', 'active', 'suspended', 'pending_fixes', 'fixing', 'pending_approval', 'completed', 'accepted')`);
        await queryRunner.query(`CREATE TABLE "city_objects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "address" character varying NOT NULL, "description" text NOT NULL, "polygon" jsonb, "work_schedule" jsonb, "documents" jsonb NOT NULL DEFAULT '[]', "status" "public"."city_objects_status_enum" NOT NULL DEFAULT 'planned', "created_by_id" uuid NOT NULL, "control_user_id" uuid, "contractor_user_id" uuid, "inspector_user_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_72e6c96f74d009458e81fd6c249" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."laboratory_samples_status_enum" AS ENUM('pending', 'in_progress', 'completed')`);
        await queryRunner.query(`CREATE TABLE "laboratory_samples" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "material_name" character varying NOT NULL, "description" text NOT NULL, "status" "public"."laboratory_samples_status_enum" NOT NULL DEFAULT 'pending', "object_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c8edf55adc9ee154b88bd811e85" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."electronic_journals_status_enum" AS ENUM('active', 'archived')`);
        await queryRunner.query(`CREATE TABLE "electronic_journals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "city_object_id" uuid NOT NULL, "status" "public"."electronic_journals_status_enum" NOT NULL DEFAULT 'active', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_36c9f375dc4845f12d27c7e69a" UNIQUE ("city_object_id"), CONSTRAINT "PK_c6ea8d504525835943588cfedd8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."violation_response_status_enum" AS ENUM('awaiting_approval', 'approved', 'needs_revision')`);
        await queryRunner.query(`CREATE TABLE "violation_response" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "violation_id" uuid NOT NULL, "description" text, "status" "public"."violation_response_status_enum" NOT NULL DEFAULT 'awaiting_approval', "controllerComment" text, "documents" jsonb DEFAULT '[]', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ebacae2968c1fe2d1f86cd6bfda" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."violation_fixability_enum" AS ENUM('fixable', 'non_fixable')`);
        await queryRunner.query(`CREATE TYPE "public"."violation_type_enum" AS ENUM('simple', 'severe')`);
        await queryRunner.query(`CREATE TYPE "public"."violation_status_enum" AS ENUM('open', 'in_progress', 'fixed', 'verified', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "violations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "category" character varying NOT NULL, "fixability" "public"."violation_fixability_enum" NOT NULL, "type" "public"."violation_type_enum" NOT NULL, "name" character varying NOT NULL, "fix_deadline" TIMESTAMP NOT NULL, "status" "public"."violation_status_enum" NOT NULL DEFAULT 'open', "documents" jsonb DEFAULT '[]', "location_data" jsonb, "inspector_location_verified" boolean NOT NULL DEFAULT false, "journal_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a2aa2d655842de3c02315ba6073" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "city_objects" ADD CONSTRAINT "FK_72bef8033c86061d74eb779f2a0" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "city_objects" ADD CONSTRAINT "FK_92c4f16fc1ddc6f00dc7b99727e" FOREIGN KEY ("control_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "city_objects" ADD CONSTRAINT "FK_e80577495c60a5fa8ede0c84464" FOREIGN KEY ("contractor_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "city_objects" ADD CONSTRAINT "FK_ac169d490f4924553f5354fa62d" FOREIGN KEY ("inspector_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "laboratory_samples" ADD CONSTRAINT "FK_0fb171c4d975b278928b85743cd" FOREIGN KEY ("object_id") REFERENCES "city_objects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "electronic_journals" ADD CONSTRAINT "FK_36c9f375dc4845f12d27c7e69a9" FOREIGN KEY ("city_object_id") REFERENCES "city_objects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "violation_response" ADD CONSTRAINT "FK_45dedcb031aad15486534880ce5" FOREIGN KEY ("violation_id") REFERENCES "violations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "violations" ADD CONSTRAINT "FK_56555e2f90c3424e9ee609d83be" FOREIGN KEY ("journal_id") REFERENCES "electronic_journals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "violations" DROP CONSTRAINT "FK_56555e2f90c3424e9ee609d83be"`);
        await queryRunner.query(`ALTER TABLE "violation_response" DROP CONSTRAINT "FK_45dedcb031aad15486534880ce5"`);
        await queryRunner.query(`ALTER TABLE "electronic_journals" DROP CONSTRAINT "FK_36c9f375dc4845f12d27c7e69a9"`);
        await queryRunner.query(`ALTER TABLE "laboratory_samples" DROP CONSTRAINT "FK_0fb171c4d975b278928b85743cd"`);
        await queryRunner.query(`ALTER TABLE "city_objects" DROP CONSTRAINT "FK_ac169d490f4924553f5354fa62d"`);
        await queryRunner.query(`ALTER TABLE "city_objects" DROP CONSTRAINT "FK_e80577495c60a5fa8ede0c84464"`);
        await queryRunner.query(`ALTER TABLE "city_objects" DROP CONSTRAINT "FK_92c4f16fc1ddc6f00dc7b99727e"`);
        await queryRunner.query(`ALTER TABLE "city_objects" DROP CONSTRAINT "FK_72bef8033c86061d74eb779f2a0"`);
        await queryRunner.query(`DROP TABLE "violations"`);
        await queryRunner.query(`DROP TYPE "public"."violation_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."violation_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."violation_fixability_enum"`);
        await queryRunner.query(`DROP TABLE "violation_response"`);
        await queryRunner.query(`DROP TYPE "public"."violation_response_status_enum"`);
        await queryRunner.query(`DROP TABLE "electronic_journals"`);
        await queryRunner.query(`DROP TYPE "public"."electronic_journals_status_enum"`);
        await queryRunner.query(`DROP TABLE "laboratory_samples"`);
        await queryRunner.query(`DROP TYPE "public"."laboratory_samples_status_enum"`);
        await queryRunner.query(`DROP TABLE "city_objects"`);
        await queryRunner.query(`DROP TYPE "public"."city_objects_status_enum"`);
        await queryRunner.query(`DROP TABLE "ttn_entries"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
