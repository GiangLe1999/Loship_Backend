import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource, Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Verification } from 'src/users/entities/verification.entity';

const GRAPHQL_ENDPOINT = '/graphql';

describe('UserModule (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let userRepository: Repository<User>;
  let verificationRepository: Repository<Verification>;

  const baseTest = () => request(app.getHttpServer()).post(GRAPHQL_ENDPOINT);
  const publicTest = (query: string) => baseTest().send({ query });
  const privateTest = (query: string) =>
    baseTest().set('X-JWT', token).send({ query });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    verificationRepository = module.get<Repository<Verification>>(
      getRepositoryToken(Verification),
    );
    await app.init();
  });

  afterAll(async () => {
    const dataSource = app.get(DataSource);
    await dataSource.dropDatabase();
    await app.close();
  });

  const testUser = {
    email: 'legiangbmt@gmai.com',
    password: 'Giang19111999@',
  };

  describe('createAccount', () => {
    it('should create account', () => {
      return publicTest(`
          mutation {
            createAccount (input:{
              email:"${testUser.email}",
              password:"${testUser.password}",
              role:Owner
              }
            ) {
              ok
              error
            }
          }
          `)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.createAccount.ok).toBe(true);
          expect(res.body.data.createAccount.error).toBe(null);
        });
    });

    it('should fail if account already exists', () => {
      return publicTest(`
          mutation {
            createAccount (input:{
              email:"${testUser.email}",
              password:"${testUser.password}",
              role:Owner
              }
            ) {
              ok
              error
            }
          }
          `)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.createAccount.ok).toBe(false);
          expect(res.body.data.createAccount.error).toBe(
            'There is a user with that email already',
          );
        });
    });
  });

  describe('login', () => {
    it('should login with correct credentials', () => {
      return publicTest(`
          mutation {
            login(input:{
              email:"${testUser.email}", 
              password:"${testUser.password}"}) {
              error
              ok
              token
            }
          }
        `)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.login.ok).toBe(true);
          expect(res.body.data.login.error).toBe(null);
          expect(res.body.data.login.token).toEqual(expect.any(String));
          token = res.body.data.login.token;
        });
    });

    it('should not be able to login with wrong credentials', () => {
      return publicTest(`
          mutation {
            login(input:{
              email:"${testUser.email}", 
              password:"wrong_password"}) {
              error
              ok
              token
            }
          }
        `)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.login.ok).toBe(false);
          expect(res.body.data.login.error).toBe('Wrong password');
          expect(res.body.data.login.token).toBe(null);
        });
    });
  });

  describe('userProfile', () => {
    let userId: number;
    beforeAll(async () => {
      const [user] = await userRepository.find();
      userId = user.id;
    });

    it('should see a user profile', () => {
      return privateTest(`{
          userProfile(userId:${userId}) {
            ok
            error
            user {
              id
              email 
            }
          }
        }
        `)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.userProfile.ok).toBe(true);
          expect(res.body.data.userProfile.error).toBe(null);
          expect(res.body.data.userProfile.user.id).toBe(userId);
        });
    });

    it('should not find a profile', () => {
      return privateTest(`{
          userProfile(userId:1999) {
            ok
            error
            user {
              id
              email 
            }
          }
        }
        `)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.userProfile.ok).toBe(false);
          expect(res.body.data.userProfile.error).toBe('User not found');
          expect(res.body.data.userProfile.user).toBe(null);
        });
    });
  });

  describe('me', () => {
    it('should find my profile', () => {
      return privateTest(`{
            me {
              email
            }
          }
        `)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.me.email).toBe(testUser.email);
        });
    });

    it('should not allow logged out user', () => {
      publicTest(`{
          me {
            email
          }
        }
      `)
        .expect(200)
        .expect((res) => {
          const [error] = res.body.errors;
          expect(error.message).toBe('Forbidden resource');
        });
    });
  });

  describe('editProfile', () => {
    const NEW_EMAIL = 'new_email@gmail.com';
    it('should change email', () => {
      return privateTest(`mutation {
            editProfile(input:{email:"${NEW_EMAIL}"}) {
              ok
              error
            }
          }
        `)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.editProfile.ok).toBe(true);
          expect(res.body.data.editProfile.error).toBe(null);
        })
        .then(() => {
          return request(app.getHttpServer())
            .post(GRAPHQL_ENDPOINT)
            .set('X-JWT', token)
            .send({
              query: `{
            me {
              email
            }
          }
        `,
            })
            .expect(200)
            .expect((res) => {
              expect(res.body.data.me.email).toBe(NEW_EMAIL);
            });
        });
    });

    it('should have new email', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('X-JWT', token)
        .send({
          query: `{
            me {
              email
            }
          }
        `,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.me.email).toBe(NEW_EMAIL);
        });
    });
  });

  describe('verifyEmail', () => {
    let verificationCode: string;
    beforeAll(async () => {
      const [verification] = await verificationRepository.find();
      verificationCode = verification.code;
    });

    it('should verify email', () => {
      return publicTest(`mutation {
        verifyEmail (input:{code:"${verificationCode}"}) {
          error
          ok
        }
      }`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.verifyEmail.ok).toBe(true);
          expect(res.body.data.verifyEmail.error).toBe(null);
        });
    });

    it('should fail on verification not found', () => {
      return publicTest(`mutation {
      verifyEmail (input:{code:"${verificationCode}"}) {
        error
        ok
      }
    }`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.verifyEmail.ok).toBe(false);
          expect(res.body.data.verifyEmail.error).toBe(
            'Verification not found',
          );
        });
    });
  });
});
