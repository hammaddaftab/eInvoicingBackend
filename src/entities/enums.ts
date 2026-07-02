export enum Emirate {
  ABU_DHABI = 'ABU_DHABI',
  DUBAI = 'DUBAI',
  SHARJAH = 'SHARJAH',
  AJMAN = 'AJMAN',
  UMM_AL_QUWAIN = 'UMM_AL_QUWAIN',
  RAS_AL_KHAIMAH = 'RAS_AL_KHAIMAH',
  FUJAIRAH = 'FUJAIRAH',
}

export enum PermissionLevel {
  READ = 'READ',
  WRITE = 'WRITE',
  DELETE = 'DELETE',
  ALL = 'ALL',
}

export enum OtpChannel {
  PHONE = 'phone',
  EMAIL = 'email',
}

export enum OtpPurpose {
  SIGNUP = 'signup',
  LOGIN = 'login',
  RESET_PASSWORD = 'reset_password',
  UPDATE_PHONE = 'update_phone',
  UPDATE_EMAIL = 'update_email',
}
