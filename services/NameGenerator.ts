export class NameGenerator {
  private static prefixes = [
    'Shadow', 'Iron', 'Golden', 'Dark', 'Light', 'Cyber', 'Neon', 'Crimson', 'Azure', 'Soul',
    'Mega', 'Ultra', 'Hyper', 'Super', 'Final', 'Omega', 'Alpha', 'Zero', 'Infinite', 'Void',
    'Ryu', 'Ken', 'Jin', 'Kazu', 'Shin', 'Goku', 'Vegeta', 'Broly', 'Gohan', 'Trunks'
  ];

  private static suffixes = [
    'Fist', 'Blade', 'Strike', 'Kick', 'Spirit', 'Ghost', 'Demon', 'Angel', 'Dragon', 'Wolf',
    'Tiger', 'Hawk', 'Falcon', 'Viper', 'Cobra', 'Lion', 'Bear', 'Shark', 'Whale', 'Eagle',
    'Master', 'Sensei', 'King', 'Lord', 'God', 'Slayer', 'Hunter', 'Warrior', 'Fighter', 'Champion'
  ];

  public static generate(): string {
    const prefix = this.prefixes[Math.floor(Math.random() * this.prefixes.length)];
    const suffix = this.suffixes[Math.floor(Math.random() * this.suffixes.length)];
    
    // 20% chance to just have a single cool name if it's short, otherwise combo
    if (Math.random() > 0.8) {
        return prefix.toUpperCase();
    }
    
    return `${prefix} ${suffix}`.toUpperCase();
  }
}