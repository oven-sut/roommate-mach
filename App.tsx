import { StatusBar } from 'expo-status-bar';
import {
  NotoSansThai_400Regular,
  NotoSansThai_600SemiBold,
  NotoSansThai_700Bold,
  NotoSansThai_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/noto-sans-thai';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Screen = 'loading' | 'login' | 'register' | 'terms' | 'privacy';
type AuthMode = 'login' | 'register';
type LegalScreen = Extract<Screen, 'terms' | 'privacy'>;

const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000')
).replace(/\/$/, '');

function getThaiApiMessage(status: number, message: unknown) {
  if (status === 409) return 'อีเมลนี้ถูกใช้สมัครสมาชิกแล้ว';
  if (status === 401) return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
  if (status === 400) {
    const text = Array.isArray(message) ? String(message[0] ?? '') : String(message ?? '');
    if (text.includes('email')) return 'กรุณากรอกอีเมลให้ถูกต้อง';
    if (text.includes('password')) return 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
    if (text.includes('displayName')) return 'ชื่อ–นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร';
    return 'กรุณาตรวจสอบข้อมูลที่กรอก';
  }
  return typeof message === 'string' ? message : 'ไม่สามารถดำเนินการได้';
}

const COLORS = {
  primary: '#FF5A28',
  primaryDark: '#E74617',
  ink: '#211318',
  muted: '#AC9294',
  line: '#ECDCD5',
  background: '#FCF8F6',
  white: '#FFFFFF',
};

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.brand, compact && styles.brandCompact]}>
      <View style={[styles.logo, compact && styles.logoCompact]}>
        <Text style={[styles.logoPeople, compact && styles.logoPeopleCompact]}>♙♙</Text>
        <View style={styles.logoRoof} />
      </View>
      <Text style={[styles.brandName, compact && styles.brandNameCompact]}>
        Roomie<Text style={styles.brandAccent}>Match</Text>
      </Text>
      {!compact && <Text style={styles.tagline}>Find your space. Meet your people.</Text>}
    </View>
  );
}

function LoadingScreen() {
  return (
    <View style={styles.loadingScreen}>
      <View style={styles.blobOne} />
      <View style={styles.blobTwo} />
      <Brand />
      <ActivityIndicator color={COLORS.primary} size="small" style={styles.loader} />
      <Text style={styles.loadingText}>กำลังเตรียมห้องที่ใช่ให้คุณ...</Text>
    </View>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor="#A8A9B8"
        secureTextEntry={secureTextEntry}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

function AuthScreen({
  mode,
  onChangeMode,
  onOpenLegal,
}: {
  mode: AuthMode;
  onChangeMode: () => void;
  onOpenLegal: (screen: LegalScreen) => void;
}) {
  const isLogin = mode === 'login';
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    setMessage(null);
  }, [mode]);

  const submit = async () => {
    if (!email.trim() || !password || (!isLogin && !displayName.trim())) {
      setMessage({ type: 'error', text: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setMessage({ type: 'error', text: 'รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน' });
      return;
    }

    if (!isLogin && !acceptedTerms) {
      setMessage({ type: 'error', text: 'กรุณายอมรับข้อกำหนดและนโยบายความเป็นส่วนตัว' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_URL}/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(!isLogin && { displayName: displayName.trim() }),
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(getThaiApiMessage(response.status, data.message));
      }

      setMessage({
        type: 'success',
        text: isLogin
          ? `เข้าสู่ระบบสำเร็จ ยินดีต้อนรับ ${data.user.displayName}`
          : `สมัครสมาชิกสำเร็จ ยินดีต้อนรับ ${data.user.displayName}`,
      });
      setPassword('');
    } catch (error) {
      const text = error instanceof Error ? error.message : 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ';
      setMessage({
        type: 'error',
        text: text === 'Failed to fetch' ? `เชื่อมต่อ API ที่ ${API_URL} ไม่สำเร็จ` : text,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.authScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.authCard}>
            <View style={styles.authHeader}>
              <Pressable style={[styles.headerIcon, !isLogin && styles.backIcon]} onPress={isLogin ? undefined : onChangeMode}>
                <Text style={[styles.headerIconText, !isLogin && styles.backIconText]}>{isLogin ? '⌂' : '‹'}</Text>
              </Pressable>
              <View>
                <Text style={styles.title}>{isLogin ? 'ยินดีต้อนรับกลับมา' : 'สร้างบัญชี'}</Text>
                <Text style={styles.subtitle}>{isLogin ? 'เข้าสู่ระบบเพื่อค้นหาคู่แมตช์ต่อ' : 'สำหรับนักศึกษา มทส. เท่านั้น'}</Text>
              </View>
            </View>

            {!isLogin && (
              <Field
                label="ชื่อ–นามสกุล"
                placeholder="ณพัฒน์ ศรีสวัสดิ์"
                value={displayName}
                onChangeText={setDisplayName}
              />
            )}
            <Field
              label="อีเมล SUT"
              placeholder="b66xxxxx@g.sut.ac.th"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <View style={styles.passwordWrap}>
              <Field
                label="รหัสผ่าน"
                placeholder="อย่างน้อย 8 ตัวอักษร"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              {isLogin && (
                <Pressable style={styles.showButton} onPress={() => setShowPassword((value) => !value)}>
                  <Text style={styles.showText}>{showPassword ? 'ซ่อน' : 'แสดง'}</Text>
                </Pressable>
              )}
            </View>

            {!isLogin && (
              <>
                <View style={styles.passwordStrength}>
                  <View style={[styles.strengthBar, styles.strengthStrong]} />
                  <View style={[styles.strengthBar, styles.strengthMedium]} />
                  <View style={styles.strengthBar} />
                  <Text style={styles.strengthText}>ดี</Text>
                </View>
                <Field
                  label="ยืนยันรหัสผ่าน"
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </>
            )}

            {isLogin && (
              <View style={styles.authOptions}>
                <Pressable style={styles.checkRow} onPress={() => setRememberMe((value) => !value)}>
                  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.optionText}>จดจำฉัน</Text>
                </Pressable>
                <Pressable><Text style={styles.forgotText}>ลืมรหัสผ่าน?</Text></Pressable>
              </View>
            )}

            {!isLogin && (
              <View style={[styles.checkRow, styles.termsRow]}>
                <Pressable style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]} onPress={() => setAcceptedTerms((value) => !value)}>
                  {acceptedTerms && <Text style={styles.checkmark}>✓</Text>}
                </Pressable>
                <Text style={styles.optionText}>
                  ฉันยอมรับ{' '}
                  <Text style={styles.inlineLink} onPress={() => onOpenLegal('terms')}>ข้อกำหนดการใช้งาน</Text>
                  {' '}และ{' '}
                  <Text style={styles.inlineLink} onPress={() => onOpenLegal('privacy')}>นโยบายความเป็นส่วนตัว</Text>
                  {' '}พร้อมยืนยันว่าเป็นนักศึกษา มทส. ปัจจุบัน
                </Text>
              </View>
            )}

            {message && (
              <View style={[styles.messageBox, message.type === 'error' ? styles.errorBox : styles.successBox]}>
                <Text style={[styles.messageText, message.type === 'error' ? styles.errorText : styles.successText]}>
                  {message.text}
                </Text>
              </View>
            )}

            <Pressable
              disabled={isSubmitting}
              onPress={submit}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
                isSubmitting && styles.primaryButtonDisabled,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>{isLogin ? 'เข้าสู่ระบบ' : 'สร้างบัญชี'}</Text>
                </>
              )}
            </Pressable>

            {isLogin && (
              <>
                <View style={styles.dividerRow}><View style={styles.divider} /><Text style={styles.dividerText}>หรือดำเนินการต่อด้วย</Text><View style={styles.divider} /></View>
                <View style={styles.socialRow}>
                  <Pressable style={styles.socialButton}><Text style={styles.socialText}>G  Google</Text></Pressable>
                  <Pressable style={styles.socialButton}><Text style={styles.socialText}>♢  SUT SSO</Text></Pressable>
                </View>
              </>
            )}
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchPrompt}>
              {isLogin ? 'ยังไม่มีบัญชี?' : 'มีบัญชีอยู่แล้ว?'}
            </Text>
            <Pressable onPress={onChangeMode} hitSlop={8}>
              <Text style={styles.switchAction}>{isLogin ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const TERMS_SECTIONS = [
  ['1. การยอมรับข้อกำหนด', 'เมื่อสมัครสมาชิกหรือใช้งาน RoomieMatch ถือว่าคุณได้อ่าน เข้าใจ และยอมรับข้อกำหนดนี้แล้ว หากไม่ยอมรับ โปรดหยุดใช้งานแอป'],
  ['2. คุณสมบัติผู้ใช้งาน', 'ผู้ใช้งานต้องเป็นนักศึกษามหาวิทยาลัยเทคโนโลยีสุรนารี ใช้ข้อมูลจริงของตนเอง และให้ข้อมูลที่ถูกต้องและเป็นปัจจุบัน เราอาจขอให้ยืนยันสถานะนักศึกษาและระงับบัญชีที่ไม่ผ่านการยืนยัน'],
  ['3. บัญชีและความปลอดภัย', 'คุณมีหน้าที่รักษารหัสผ่านเป็นความลับ ห้ามขาย โอน ให้เช่า หรือให้บุคคลอื่นใช้บัญชี หากพบการเข้าถึงโดยไม่ได้รับอนุญาต โปรดเปลี่ยนรหัสผ่านและแจ้งผู้ดูแลทันที'],
  ['4. การจับคู่', 'ผลการจับคู่เป็นเพียงคำแนะนำจากข้อมูลโปรไฟล์และแบบสอบถาม ไม่ใช่การรับรองตัวตน ความน่าเชื่อถือ หรือความปลอดภัยของบุคคลใด ผู้ใช้ต้องตรวจสอบข้อมูลและใช้วิจารณญาณก่อนพบปะหรือทำข้อตกลงร่วมกัน'],
  ['5. พฤติกรรมที่ห้าม', 'ห้ามสวมรอย ให้ข้อมูลเท็จ คุกคาม กลั่นแกล้ง เลือกปฏิบัติ เผยแพร่เนื้อหาผิดกฎหมาย หลอกลวง เรียกเก็บเงิน ส่งสแปม เจาะระบบ หรือใช้ข้อมูลของผู้อื่นโดยไม่ได้รับอนุญาต'],
  ['6. เนื้อหาและการสนทนา', 'คุณยังคงเป็นเจ้าของเนื้อหาที่อัปโหลด และอนุญาตให้เราประมวลผลเท่าที่จำเป็นต่อการให้บริการ การจับคู่ และความปลอดภัย โปรดอย่าส่งรหัสผ่าน ข้อมูลทางการเงิน หรือข้อมูลสำคัญให้บุคคลที่ยังไม่ไว้วางใจ'],
  ['7. การพบปะและความปลอดภัย', 'ควรพบกันครั้งแรกในพื้นที่สาธารณะ แจ้งบุคคลที่ไว้ใจ และจัดการเดินทางด้วยตนเอง หากรู้สึกไม่ปลอดภัยให้ยุติการติดต่อ บล็อก และรายงานผู้ใช้นั้น กรณีฉุกเฉินโปรดติดต่อหน่วยงานฉุกเฉินโดยตรง'],
  ['8. การรายงานและระงับบัญชี', 'เราอาจตรวจสอบ จำกัด ระงับ หรือลบบัญชีที่ฝ่าฝืนข้อกำหนด สร้างความเสี่ยงต่อผู้อื่น หรือใช้งานโดยทุจริต โดยอาจไม่แจ้งล่วงหน้าเมื่อจำเป็นด้านความปลอดภัย'],
  ['9. ข้อจำกัดความรับผิด', 'RoomieMatch ไม่ได้เป็นนายหน้า คู่สัญญาเช่า หรือผู้รับประกันข้อตกลงระหว่างผู้ใช้ เราไม่รับผิดชอบต่อการตัดสินใจ การพบปะ ธุรกรรม หรือข้อพิพาทระหว่างผู้ใช้ ภายในขอบเขตที่กฎหมายอนุญาต'],
  ['10. การเปลี่ยนแปลงและการติดต่อ', 'เราอาจปรับปรุงข้อกำหนดนี้และจะแจ้งการเปลี่ยนแปลงสำคัญผ่านแอป หากมีคำถาม โปรดติดต่อผู้ดูแล RoomieMatch ผ่านช่องทางที่ประกาศภายในแอป'],
] as const;

const PRIVACY_SECTIONS = [
  ['1. ข้อมูลที่เราเก็บรวบรวม', 'เราอาจเก็บชื่อ–นามสกุล อีเมล SUT ข้อมูลยืนยันสถานะนักศึกษา รูปโปรไฟล์ คณะ ชั้นปี ความต้องการด้านที่พัก คำตอบแบบสอบถาม การจับคู่ ข้อความ การบล็อก การรายงาน และข้อมูลทางเทคนิคที่จำเป็นต่อการทำงานของระบบ'],
  ['2. วัตถุประสงค์', 'เราใช้ข้อมูลเพื่อสร้างและดูแลบัญชี ยืนยันสถานะนักศึกษา แนะนำคู่ที่เหมาะสม ให้บริการแชตและการแจ้งเตือน ดูแลความปลอดภัย ป้องกันการทุจริต แก้ไขปัญหาทางเทคนิค และปรับปรุงบริการ'],
  ['3. ฐานในการประมวลผล', 'เราประมวลผลข้อมูลเท่าที่จำเป็นต่อการให้บริการตามข้อตกลง ตามความยินยอม เพื่อประโยชน์โดยชอบด้วยกฎหมายด้านความปลอดภัย หรือเพื่อปฏิบัติตามกฎหมาย'],
  ['4. ข้อมูลที่แสดงแก่ผู้อื่น', 'โปรไฟล์และความต้องการบางส่วนจะแสดงแก่ผู้ใช้รายอื่นเพื่อการค้นหาและจับคู่ แต่อีเมล รหัสผ่าน ข้อมูลยืนยันตัวตน บันทึกทางเทคนิค และรายละเอียดการรายงานจะไม่แสดงต่อผู้ใช้ทั่วไป'],
  ['5. การเปิดเผยข้อมูล', 'เราอาจเปิดเผยข้อมูลเท่าที่จำเป็นแก่ผู้ให้บริการระบบคลาวด์ ฐานข้อมูล การยืนยันตัวตน การแจ้งเตือน ผู้ดูแลที่ได้รับอนุญาต หรือหน่วยงานที่มีอำนาจตามกฎหมาย เราไม่ขายข้อมูลส่วนบุคคลเพื่อการโฆษณา'],
  ['6. ระยะเวลาการเก็บรักษา', 'เราเก็บข้อมูลระหว่างที่บัญชียังใช้งานและเท่าที่จำเป็นต่อวัตถุประสงค์ เมื่อผู้ใช้ลบบัญชี เราจะลบหรือทำให้ข้อมูลไม่สามารถระบุตัวบุคคลได้ เว้นแต่จำเป็นต้องเก็บเพื่อกฎหมาย ความปลอดภัย หรือข้อพิพาท'],
  ['7. การรักษาความปลอดภัย', 'เราใช้มาตรการที่เหมาะสม เช่น การเข้ารหัสการรับส่งข้อมูล การแฮชรหัสผ่าน และการจำกัดสิทธิการเข้าถึง อย่างไรก็ตาม ไม่มีระบบใดรับประกันความปลอดภัยได้ทั้งหมด'],
  ['8. สิทธิของคุณ', 'ภายใต้กฎหมาย คุณอาจขอเข้าถึง รับสำเนา แก้ไข ลบ จำกัด คัดค้าน หรือโอนข้อมูล รวมถึงถอนความยินยอมและร้องเรียนต่อสำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคลได้'],
  ['9. บริการภายนอกและการโอนข้อมูล', 'หากเลือกใช้ Google หรือ SUT SSO ข้อมูลจะอยู่ภายใต้นโยบายของผู้ให้บริการนั้นด้วย ผู้ให้บริการบางรายอาจประมวลผลข้อมูลในต่างประเทศโดยมีมาตรการคุ้มครองที่เหมาะสม'],
  ['10. การเปลี่ยนแปลงและการติดต่อ', 'เราอาจปรับปรุงนโยบายนี้และจะแจ้งการเปลี่ยนแปลงสำคัญผ่านแอป หากต้องการใช้สิทธิหรือสอบถามเรื่องข้อมูลส่วนบุคคล โปรดติดต่อผู้ดูแล RoomieMatch ผ่านช่องทางที่ประกาศภายในแอป'],
] as const;

function LegalPage({ screen, onBack }: { screen: LegalScreen; onBack: () => void }) {
  const isTerms = screen === 'terms';
  const sections = isTerms ? TERMS_SECTIONS : PRIVACY_SECTIONS;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.legalHeader}>
        <Pressable style={[styles.headerIcon, styles.backIcon]} onPress={onBack} hitSlop={8}>
          <Text style={[styles.headerIconText, styles.backIconText]}>‹</Text>
        </Pressable>
        <View style={styles.legalHeaderText}>
          <Text style={styles.legalTitle}>{isTerms ? 'ข้อกำหนดการใช้งาน' : 'นโยบายความเป็นส่วนตัว'}</Text>
          <Text style={styles.legalUpdated}>ปรับปรุงล่าสุด 18 กรกฎาคม 2569</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.legalContent} showsVerticalScrollIndicator={false}>
        <View style={styles.legalIntro}>
          <Text style={styles.legalIntroText}>{isTerms ? 'โปรดอ่านข้อกำหนดนี้ก่อนสมัครและใช้งาน RoomieMatch' : 'RoomieMatch เคารพความเป็นส่วนตัวและใช้ข้อมูลเท่าที่จำเป็นต่อการให้บริการ'}</Text>
        </View>
        {sections.map(([title, body]) => (
          <View style={styles.legalSection} key={title}>
            <Text style={styles.legalSectionTitle}>{title}</Text>
            <Text style={styles.legalBody}>{body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('loading');
  const [fontsLoaded] = useFonts({
    NotoSansThai_400Regular,
    NotoSansThai_600SemiBold,
    NotoSansThai_700Bold,
    NotoSansThai_800ExtraBold,
  });

  useEffect(() => {
    const timer = setTimeout(() => setScreen('login'), 1400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.flex}>
      <StatusBar style={screen === 'loading' ? 'light' : 'dark'} />
      {screen === 'loading' || !fontsLoaded ? (
        <LoadingScreen />
      ) : screen === 'terms' || screen === 'privacy' ? (
        <LegalPage screen={screen} onBack={() => setScreen('register')} />
      ) : (
        <AuthScreen
          mode={screen}
          onChangeMode={() => setScreen(screen === 'login' ? 'register' : 'login')}
          onOpenLegal={setScreen}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: COLORS.primary,
  },
  blobOne: {
    position: 'absolute',
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -120,
    right: -120,
  },
  blobTwo: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -90,
    left: -90,
  },
  brand: { alignItems: 'center' },
  brandCompact: { marginBottom: 30 },
  logo: {
    width: 96,
    height: 82,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    marginBottom: 18,
    shadowColor: '#292365',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  logoCompact: { width: 62, height: 54, borderRadius: 18, marginBottom: 10 },
  logoPeople: { color: COLORS.primary, fontSize: 32, fontWeight: '900', letterSpacing: -8 },
  logoPeopleCompact: { fontSize: 22, letterSpacing: -6 },
  logoRoof: {
    position: 'absolute',
    top: 19,
    width: 36,
    height: 36,
    borderLeftWidth: 4,
    borderTopWidth: 4,
    borderColor: COLORS.primary,
    transform: [{ rotate: '45deg' }],
    borderRadius: 3,
  },
  brandName: { color: COLORS.white, fontSize: 34, fontFamily: 'NotoSansThai_800ExtraBold', letterSpacing: -1.2 },
  brandNameCompact: { color: COLORS.ink, fontSize: 24 },
  brandAccent: { color: '#C7C3FF' },
  tagline: { color: 'rgba(255,255,255,0.78)', fontSize: 14, fontFamily: 'NotoSansThai_400Regular', marginTop: 8, letterSpacing: 0.2 },
  loader: { marginTop: 64 },
  loadingText: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontFamily: 'NotoSansThai_400Regular', marginTop: 14 },
  authScroll: { flexGrow: 1, paddingHorizontal: 32, paddingTop: 72, paddingBottom: 34 },
  authCard: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    backgroundColor: 'transparent',
  },
  eyebrow: { color: COLORS.primary, fontSize: 11, fontFamily: 'NotoSansThai_800ExtraBold', letterSpacing: 1.8, marginBottom: 8 },
  authHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  headerIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, marginRight: 16 },
  headerIconText: { color: COLORS.white, fontSize: 28, fontFamily: 'NotoSansThai_700Bold' },
  backIcon: { backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.line },
  backIconText: { color: '#8E1830' },
  title: { color: COLORS.ink, fontSize: 24, lineHeight: 31, fontFamily: 'NotoSansThai_800ExtraBold' },
  subtitle: { color: COLORS.muted, fontSize: 16, lineHeight: 23, fontFamily: 'NotoSansThai_400Regular' },
  field: { marginBottom: 20 },
  label: { color: '#A88F91', fontSize: 15, fontFamily: 'NotoSansThai_700Bold', marginBottom: 9, letterSpacing: 1.2 },
  input: {
    height: 64,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: 19,
    paddingHorizontal: 20,
    color: COLORS.ink,
    fontSize: 17,
    fontFamily: 'NotoSansThai_400Regular',
    backgroundColor: COLORS.white,
  },
  passwordWrap: { position: 'relative' },
  showButton: { position: 'absolute', right: 18, bottom: 39 },
  showText: { color: '#A68D90', fontSize: 14, fontFamily: 'NotoSansThai_400Regular' },
  authOptions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: -3, marginBottom: 20 },
  checkRow: { flexDirection: 'row', alignItems: 'center' },
  checkbox: { width: 23, height: 23, borderRadius: 7, borderWidth: 1.5, borderColor: COLORS.line, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  checkboxChecked: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  checkmark: { color: COLORS.white, fontSize: 14, fontFamily: 'NotoSansThai_700Bold' },
  optionText: { flexShrink: 1, color: COLORS.muted, fontSize: 14, lineHeight: 22, fontFamily: 'NotoSansThai_400Regular' },
  forgotText: { color: '#F04416', fontSize: 14, fontFamily: 'NotoSansThai_700Bold' },
  inlineLink: { color: '#8E1830', fontFamily: 'NotoSansThai_700Bold' },
  termsRow: { alignItems: 'flex-start', marginBottom: 20 },
  legalHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 18, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.line, backgroundColor: COLORS.background },
  legalHeaderText: { flex: 1 },
  legalTitle: { color: COLORS.ink, fontSize: 21, fontFamily: 'NotoSansThai_800ExtraBold' },
  legalUpdated: { color: COLORS.muted, fontSize: 12, marginTop: 2, fontFamily: 'NotoSansThai_400Regular' },
  legalContent: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 22, paddingBottom: 48 },
  legalIntro: { borderRadius: 18, backgroundColor: '#FFF0E9', padding: 18, marginBottom: 24 },
  legalIntroText: { color: '#8E3217', fontSize: 14, lineHeight: 23, fontFamily: 'NotoSansThai_600SemiBold' },
  legalSection: { marginBottom: 23 },
  legalSectionTitle: { color: COLORS.ink, fontSize: 16, lineHeight: 25, marginBottom: 6, fontFamily: 'NotoSansThai_700Bold' },
  legalBody: { color: '#725F62', fontSize: 14, lineHeight: 24, fontFamily: 'NotoSansThai_400Regular' },
  passwordStrength: { flexDirection: 'row', alignItems: 'center', marginTop: -10, marginBottom: 20, paddingHorizontal: 4 },
  strengthBar: { flex: 1, height: 5, borderRadius: 3, backgroundColor: '#EDE3DF', marginRight: 6 },
  strengthStrong: { backgroundColor: COLORS.primary },
  strengthMedium: { backgroundColor: '#FFB526' },
  strengthText: { color: '#F49A00', fontSize: 13, fontFamily: 'NotoSansThai_700Bold' },
  primaryButton: {
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  primaryButtonPressed: { backgroundColor: COLORS.primaryDark, transform: [{ scale: 0.99 }] },
  primaryButtonDisabled: { opacity: 0.65 },
  primaryButtonText: { color: COLORS.white, fontSize: 16, fontFamily: 'NotoSansThai_800ExtraBold' },
  arrow: { color: COLORS.white, fontSize: 21, marginLeft: 10, marginTop: -2 },
  terms: { color: COLORS.muted, fontSize: 11, lineHeight: 19, fontFamily: 'NotoSansThai_400Regular', textAlign: 'center', marginTop: 16 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 26 },
  divider: { flex: 1, height: 1, backgroundColor: COLORS.line },
  dividerText: { color: COLORS.muted, fontSize: 14, marginHorizontal: 14, fontFamily: 'NotoSansThai_400Regular' },
  socialRow: { flexDirection: 'row', gap: 14 },
  socialButton: { flex: 1, height: 62, borderWidth: 1.5, borderColor: COLORS.line, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white },
  socialText: { color: '#8E1830', fontSize: 16, fontFamily: 'NotoSansThai_700Bold' },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 'auto', paddingTop: 52 },
  switchPrompt: { color: COLORS.muted, fontSize: 14, fontFamily: 'NotoSansThai_400Regular', marginRight: 6 },
  switchAction: { color: COLORS.primary, fontSize: 14, fontFamily: 'NotoSansThai_800ExtraBold' },
  messageBox: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 14 },
  errorBox: { backgroundColor: '#FFF0F0' },
  successBox: { backgroundColor: '#ECF9F1' },
  messageText: { fontSize: 12, lineHeight: 20, fontFamily: 'NotoSansThai_600SemiBold' },
  errorText: { color: '#C63D48' },
  successText: { color: '#278255' },
});
