const nutritionProfiles = {
  rice: [356, 7.1, 79, 0.7, 1.3, 0.1, 5],
  brownRice: [370, 7.5, 77, 2.7, 3.5, 0.9, 5],
  grain: [343, 12.5, 70, 2.5, 10, 1.5, 5],
  refinedFlour: [364, 10, 76, 1, 2.7, 0.3, 2],
  millet: [365, 11, 70, 4, 8, 2, 5],
  oats: [389, 16.9, 66.3, 6.9, 10.6, 0.9, 2],
  pulse: [352, 23, 60, 2, 15, 3, 10],
  bean: [337, 22, 61, 1.5, 16, 2, 24],
  soy: [446, 36, 30, 20, 9, 7, 2],
  tofu: [144, 17, 3, 9, 2, 0.6, 14],
  vegetable: [32, 1.8, 6, 0.3, 2.3, 2.8, 35],
  leafy: [35, 3, 5, 0.6, 3, 0.6, 70],
  tomato: [18, 0.9, 3.9, 0.2, 1.2, 2.6, 5],
  root: [75, 2, 17, 0.2, 2.5, 5, 40],
  fruit: [52, 0.5, 14, 0.2, 2, 10, 2],
  banana: [89, 1.1, 23, 0.3, 2.6, 12, 1],
  citrus: [40, 0.8, 10, 0.2, 2.5, 7, 2],
  coconut: [354, 3.3, 15, 33.5, 9, 6, 20],
  coconutMilk: [197, 2, 6, 20, 0, 3, 15],
  dairy: [61, 3.2, 4.8, 3.3, 0, 4.8, 43],
  soyMilk: [41, 3.3, 3.2, 1.8, 0.6, 0.6, 45],
  curd: [61, 3.5, 4.7, 3.3, 0, 4.7, 46],
  paneer: [265, 18, 3.5, 20, 0, 3.5, 40],
  cheese: [350, 25, 2, 27, 0, 1, 700],
  ghee: [900, 0, 0, 100, 0, 0, 2],
  butter: [717, 0.9, 0.1, 81, 0, 0.1, 11],
  oil: [884, 0, 0, 100, 0, 0, 0],
  egg: [143, 13, 1.1, 10, 0, 1.1, 142],
  poultry: [120, 22.5, 0, 2.6, 0, 0, 74],
  meat: [250, 26, 0, 17, 0, 0, 70],
  fish: [130, 22, 0, 4, 0, 0, 50],
  shellfish: [99, 24, 0.2, 0.3, 0, 0, 111],
  nut: [580, 20, 20, 50, 10, 5, 5],
  seed: [560, 20, 24, 47, 12, 2, 20],
  spice: [300, 10, 60, 8, 20, 5, 50],
  herb: [40, 3, 7, 0.8, 4, 1, 50],
  sweetener: [387, 0, 100, 0, 0, 100, 1],
  jaggery: [383, 0.4, 98, 0.1, 0, 97, 30],
  salt: [0, 0, 0, 0, 0, 0, 38000],
  water: [0, 0, 0, 0, 0, 0, 0],
  condiment: [53, 8, 5, 0.6, 0.8, 0.4, 5500],
  gelatin: [335, 85, 0, 0, 0, 0, 500],
  tomatoPaste: [82, 4.3, 19, 0.5, 4.1, 12, 59],
  chocolate: [546, 5, 61, 31, 7, 48, 24],
}

const ingredientRows = `
basmati_rice|Basmati rice, raw|Grains|rice|110|1|1
sona_masoori_rice|Sona masoori rice, raw|Grains|rice|78|1|1
brown_rice|Brown rice, raw|Grains|brownRice|105|1|1
red_rice|Red rice, raw|Grains|brownRice|125|1|1
poha|Flattened rice (poha)|Grains|rice|85|1|1
brown_poha|Brown flattened rice|Grains|brownRice|110|1|1
semolina|Semolina (rava/sooji)|Grains|grain|65|1|1
idli_rava|Idli rava|Grains|rice|70|1|1
whole_wheat_flour|Whole wheat flour (atta)|Grains|grain|55|1|1
refined_wheat_flour|Refined wheat flour (maida)|Grains|refinedFlour|48|1|1
rice_flour|Rice flour|Grains|rice|70|1|1
ragi_flour|Finger millet flour|Grains|millet|82|1|1
bajra_flour|Pearl millet flour|Grains|millet|62|1|1
jowar_flour|Sorghum flour|Grains|millet|75|1|1
chickpea_flour|Chickpea flour (besan)|Grains|pulse|90|1|1
corn_flour|Corn flour|Grains|refinedFlour|85|1|1
rolled_oats|Rolled oats|Grains|oats|150|1|1
steel_cut_oats|Steel-cut oats|Grains|oats|180|1|1
barley|Pearl barley, raw|Grains|grain|95|1|1
quinoa|Quinoa, raw|Grains|grain|420|1|1
foxtail_millet|Foxtail millet, raw|Grains|millet|120|1|1
little_millet|Little millet, raw|Grains|millet|115|1|1
barnyard_millet|Barnyard millet, raw|Grains|millet|130|1|1
kodo_millet|Kodo millet, raw|Grains|millet|110|1|1
vermicelli|Wheat vermicelli|Grains|refinedFlour|90|1|1
whole_wheat_bread|Whole wheat bread|Grains|grain|110|30|1
pav_bread|Pav bread|Grains|refinedFlour|100|40|1
whole_wheat_pasta|Whole wheat pasta, dry|Grains|grain|180|1|1
rice_noodles|Rice noodles, dry|Grains|rice|170|1|1
whole_wheat_noodles|Whole wheat noodles, dry|Grains|grain|150|1|1
cornmeal|Cornmeal|Grains|grain|90|1|1
makki_flour|Maize flour (makki atta)|Grains|grain|65|1|1
sattu|Roasted gram flour (sattu)|Grains|pulse|100|1|1
toor_dal|Pigeon pea split (toor dal), raw|Pulses|pulse|150|1|1
black_gram|Black gram (urad dal), raw|Pulses|pulse|150|1|1
green_moong|Green gram (moong), raw|Pulses|pulse|140|1|1
tapioca_pearls|Tapioca pearls (sabudana), dry|Grains|rice|130|1|1
moong_dal|Split mung beans (moong dal), raw|Pulses|pulse|145|1|1
urad_dal|Black gram split (urad dal), raw|Pulses|pulse|155|1|1
masoor_dal|Red lentils (masoor dal), raw|Pulses|pulse|135|1|1
chana_dal|Split Bengal gram (chana dal), raw|Pulses|pulse|130|1|1
whole_moong|Whole mung beans, raw|Pulses|pulse|140|1|1
whole_urad|Whole black gram, raw|Pulses|pulse|145|1|1
chickpeas|Kabuli chickpeas, raw|Pulses|pulse|140|1|1
black_chickpeas|Kala chana, raw|Pulses|pulse|125|1|1
kidney_beans|Rajma, dried|Pulses|bean|145|1|1
black_eyed_peas|Cowpeas (lobia), dried|Pulses|bean|125|1|1
horse_gram|Horse gram (kulthi), raw|Pulses|pulse|115|1|1
green_peas_dried|Dried green peas|Pulses|pulse|120|1|1
soybeans|Soybeans, dried|Pulses|soy|190|1|1
soy_chunks|Textured soy protein, dry|Pulses|soy|140|1|1
tofu|Firm tofu|Pulses|tofu|260|1|1
tempeh|Tempeh|Pulses|soy|360|1|1
sprouted_mung|Mung bean sprouts|Pulses|pulse|90|1|1
peanuts|Peanuts, raw|Nuts & seeds|nut|180|1|1
potato|Potato|Vegetables|root|32|170|1
sweet_potato|Sweet potato|Vegetables|root|55|180|1
red_onion|Red onion|Vegetables|vegetable|36|110|1
white_onion|White onion|Vegetables|vegetable|40|110|1
shallot|Shallot|Vegetables|vegetable|75|25|1
garlic|Garlic|Vegetables|vegetable|180|3|1
tomato|Tomato|Vegetables|tomato|35|120|1
carrot|Carrot|Vegetables|root|45|60|1
beetroot|Beetroot|Vegetables|root|40|100|1
radish|White radish (mooli)|Vegetables|vegetable|35|100|1
turnip|Turnip|Vegetables|root|50|100|1
pumpkin|Pumpkin|Vegetables|vegetable|35|1|1
bottle_gourd|Bottle gourd (lauki)|Vegetables|vegetable|35|1|1
ridge_gourd|Ridge gourd (turai)|Vegetables|vegetable|45|1|1
bitter_gourd|Bitter gourd (karela)|Vegetables|vegetable|60|1|1
snake_gourd|Snake gourd|Vegetables|vegetable|55|1|1
ash_gourd|Ash gourd|Vegetables|vegetable|45|1|1
okra|Okra (bhindi)|Vegetables|vegetable|60|1|1
aubergine|Eggplant (brinjal)|Vegetables|vegetable|45|1|1
cauliflower|Cauliflower|Vegetables|vegetable|42|1|1
cabbage|Cabbage|Vegetables|vegetable|32|1|1
red_cabbage|Red cabbage|Vegetables|vegetable|80|1|1
spinach|Spinach|Vegetables|leafy|45|1|1
amaranth_leaves|Amaranth leaves|Vegetables|leafy|55|1|1
fenugreek_leaves|Fenugreek leaves (methi)|Vegetables|leafy|50|1|1
mustard_greens|Mustard greens (sarson)|Vegetables|leafy|45|1|1
drumstick_leaves|Moringa leaves|Vegetables|leafy|100|1|1
drumstick|Drumstick pods|Vegetables|vegetable|90|1|1
green_beans|Green beans|Vegetables|vegetable|70|1|1
green_peas|Green peas, fresh|Vegetables|vegetable|100|1|1
sweet_corn|Sweet corn kernels|Vegetables|vegetable|90|1|1
capsicum|Green capsicum|Vegetables|vegetable|90|120|1
red_capsicum|Red capsicum|Vegetables|vegetable|130|120|1
green_chilli|Green chilli|Vegetables|vegetable|100|8|1
mushroom|Button mushrooms|Vegetables|vegetable|180|1|1
raw_banana|Raw banana|Vegetables|root|50|120|1
raw_papaya|Raw papaya|Vegetables|vegetable|55|1|1
cucumber|Cucumber|Vegetables|vegetable|40|200|1
lettuce|Lettuce|Vegetables|leafy|120|1|1
celery|Celery|Vegetables|vegetable|160|1|1
spring_onion|Spring onion|Vegetables|vegetable|90|15|1
ginger|Fresh ginger|Vegetables|vegetable|120|5|1
green_coconut|Fresh coconut flesh|Vegetables|coconut|180|1|1
banana|Banana|Fruits|banana|8|120|1
mango|Mango|Fruits|fruit|110|250|1
apple|Apple|Fruits|fruit|180|180|1
orange|Orange|Fruits|citrus|70|150|1
papaya|Papaya|Fruits|fruit|60|1|1
guava|Guava|Fruits|fruit|90|1|1
pineapple|Pineapple|Fruits|fruit|75|1|1
watermelon|Watermelon|Fruits|fruit|35|1|1
pomegranate|Pomegranate arils|Fruits|fruit|220|1|1
grapes|Grapes|Fruits|fruit|120|1|1
jackfruit|Jackfruit|Fruits|fruit|100|1|1
amla|Indian gooseberry (amla)|Fruits|fruit|140|20|1
jamun|Java plum (jamun)|Fruits|fruit|160|10|1
lemon|Lemon|Fruits|citrus|60|50|1
lime|Lime|Fruits|citrus|55|45|1
dates|Dates, dried|Fruits|fruit|320|8|1
raisins|Raisins|Fruits|fruit|280|1|1
strawberry|Strawberries|Fruits|fruit|300|15|1
pear|Pear|Fruits|fruit|220|170|1
coconut_milk|Coconut milk|Dairy alternatives|coconutMilk|180|1|1.01
milk|Whole cow milk|Dairy|dairy|68|1|1.03
low_fat_milk|Low-fat cow milk|Dairy|dairy|58|1|1.03
curd|Plain curd (dahi)|Dairy|curd|85|1|1.03
buttermilk|Buttermilk (chaas)|Dairy|curd|45|1|1.02
paneer|Paneer|Dairy|paneer|380|1|1.02
cheese|Cheddar-style cheese|Dairy|cheese|520|1|1.03
butter|Butter|Dairy|butter|560|1|0.91
ghee|Ghee|Dairy|ghee|650|1|0.91
cream|Fresh cream|Dairy|dairy|280|1|1.01
khoya|Khoya (mawa)|Dairy|paneer|450|1|1.05
condensed_milk|Sweetened condensed milk|Dairy|dairy|250|1|1.3
eggs|Whole egg|Protein|egg|8|50|1
chicken|Chicken breast, raw|Protein|poultry|300|1|1
chicken_thigh|Chicken thigh, raw|Protein|poultry|280|1|1
mutton|Mutton, raw|Protein|meat|750|1|1
fish|Rohu fish, raw|Protein|fish|320|1|1
salmon|Salmon, raw|Protein|fish|900|1|1
prawns|Prawns, raw|Protein|shellfish|500|1|1
crab|Crab meat|Protein|shellfish|650|1|1
anchovy|Anchovy, raw|Protein|fish|420|1|1
paneer_cubes|Paneer cubes|Protein|paneer|380|1|1
edamame|Edamame, shelled|Pulses|soy|240|1|1
cashews|Cashews|Nuts & seeds|nut|900|1|1
almonds|Almonds|Nuts & seeds|nut|950|1|1
walnuts|Walnuts|Nuts & seeds|nut|1200|1|1
pistachios|Pistachios|Nuts & seeds|nut|1400|1|1
raisins_black|Black raisins|Nuts & seeds|fruit|380|1|1
sesame_seeds|Sesame seeds|Nuts & seeds|seed|300|1|1
flaxseed|Flaxseed|Nuts & seeds|seed|260|1|1
chia_seeds|Chia seeds|Nuts & seeds|seed|900|1|1
pumpkin_seeds|Pumpkin seeds|Nuts & seeds|seed|600|1|1
sunflower_seeds|Sunflower seeds|Nuts & seeds|seed|350|1|1
mustard_seeds|Mustard seeds|Nuts & seeds|seed|180|1|1
fenugreek_seeds|Fenugreek seeds|Nuts & seeds|spice|180|1|1
black_sesame|Black sesame seeds|Nuts & seeds|seed|320|1|1
cocoa_powder|Unsweetened cocoa powder|Pantry|chocolate|500|1|1
cooking_oil|Neutral cooking oil|Pantry|oil|150|1|0.92
mustard_oil|Mustard oil|Pantry|oil|180|1|0.92
sesame_oil|Sesame oil|Pantry|oil|450|1|0.92
olive_oil|Olive oil|Pantry|oil|900|1|0.91
salt|Iodized salt|Pantry|salt|22|1|1
sugar|White sugar|Pantry|sweetener|48|1|1
jaggery|Jaggery|Pantry|jaggery|70|1|1
honey|Honey|Pantry|sweetener|350|1|1.42
tamarind|Tamarind pulp|Pantry|fruit|180|1|1.1
vinegar|Vinegar|Pantry|vegetable|70|1|1.01
soy_sauce|Soy sauce|Pantry|condiment|260|1|1.1
coconut_vinegar|Coconut vinegar|Pantry|vegetable|180|1|1
tomato_paste|Tomato paste|Pantry|tomatoPaste|160|1|1.05
peanut_butter|Peanut butter|Pantry|nut|400|1|1.1
chilli_sauce|Chilli sauce|Pantry|vegetable|220|1|1.1
garam_masala|Garam masala|Spices|spice|900|1|1
turmeric|Turmeric powder|Spices|spice|450|1|1
red_chilli_powder|Red chilli powder|Spices|spice|500|1|1
coriander_powder|Coriander powder|Spices|spice|380|1|1
cumin_seeds|Cumin seeds|Spices|spice|600|1|1
black_pepper|Black pepper|Spices|spice|1100|1|1
cardamom|Green cardamom|Spices|spice|4000|1|1
cinnamon|Cinnamon|Spices|spice|900|1|1
cloves|Cloves|Spices|spice|1400|1|1
fennel_seeds|Fennel seeds|Spices|spice|450|1|1
carom_seeds|Carom seeds (ajwain)|Spices|spice|500|1|1
mustard_seed_powder|Mustard seed powder|Spices|spice|300|1|1
asafoetida|Asafoetida (hing)|Spices|spice|2200|1|1
amchur|Dried mango powder (amchur)|Spices|spice|600|1|1
black_cardamom|Black cardamom|Spices|spice|1800|1|1
star_anise|Star anise|Spices|spice|1200|1|1
bay_leaf|Bay leaf|Spices|spice|900|1|1
nutmeg|Nutmeg|Spices|spice|1800|1|1
saffron|Saffron|Spices|spice|250000|1|1
curry_leaves|Curry leaves|Herbs|herb|220|1|1
coriander_leaves|Fresh coriander leaves|Herbs|herb|120|1|1
mint|Fresh mint|Herbs|herb|180|1|1
basil|Fresh basil|Herbs|herb|300|1|1
thyme|Fresh thyme|Herbs|herb|900|1|1
rosemary|Fresh rosemary|Herbs|herb|900|1|1
dill|Fresh dill|Herbs|herb|400|1|1
spring_mint|Mint leaves|Herbs|herb|180|1|1
lemongrass|Lemongrass|Herbs|herb|250|1|1
ginger_garlic_paste|Ginger-garlic paste|Condiments|vegetable|180|1|1
garlic_paste|Garlic paste|Condiments|vegetable|180|1|1
green_chilli_paste|Green chilli paste|Condiments|vegetable|150|1|1
red_chilli_sauce|Red chilli sauce|Condiments|vegetable|250|1|1
pickle|Indian mixed pickle|Condiments|vegetable|220|1|1
lemon_juice|Lemon juice|Condiments|citrus|60|1|1
date_tamarind_chutney|Date-tamarind chutney|Condiments|fruit|220|1|1
mint_chutney|Mint chutney|Condiments|herb|180|1|1
coriander_chutney|Coriander chutney|Condiments|herb|160|1|1
idli_podi|Idli podi|Condiments|spice|500|1|1
peanut_chutney|Peanut chutney|Condiments|nut|220|1|1
tomato_chutney|Tomato chutney|Condiments|tomato|170|1|1
chocolate_dark|Dark chocolate|Sweets|chocolate|1600|1|1
coconut_sugar|Coconut sugar|Sweets|sweetener|420|1|1
vanilla|Vanilla extract|Pantry|vegetable|2000|1|1
water|Drinking water|Pantry|water|0|1|1
green_gram_flour|Mung bean flour|Grains|pulse|140|1|1
black_gram_flour|Black gram flour|Grains|pulse|150|1|1
amaranth_flour|Amaranth flour|Grains|grain|180|1|1
water_chestnut_flour|Water chestnut flour|Grains|grain|240|1|1
makhana|Fox nuts (makhana)|Grains|grain|900|1|1
lotus_seeds|Lotus seeds|Nuts & seeds|seed|800|1|1
white_peas|Dried white peas|Pulses|pulse|100|1|1
black_gram_whole|Whole urad (black gram)|Pulses|pulse|145|1|1
red_lentils|Red lentils|Pulses|pulse|135|1|1
split_peas|Split peas|Pulses|pulse|105|1|1
chickpea_sprouts|Chickpea sprouts|Pulses|pulse|120|1|1
french_beans|French beans|Vegetables|vegetable|85|1|1
zucchini|Zucchini|Vegetables|vegetable|160|1|1
broccoli|Broccoli|Vegetables|vegetable|180|1|1
asparagus|Asparagus|Vegetables|vegetable|500|1|1
fennel_bulb|Fennel bulb|Vegetables|vegetable|160|1|1
leek|Leek|Vegetables|vegetable|240|1|1
chayote|Chayote (chow chow)|Vegetables|vegetable|75|1|1
colocasia|Colocasia root (arbi)|Vegetables|root|70|1|1
yam|Yam|Vegetables|root|65|1|1
green_papaya|Green papaya|Vegetables|vegetable|55|1|1
cherry_tomato|Cherry tomatoes|Vegetables|tomato|100|1|1
cherry|Cherries|Fruits|fruit|600|1|1
kiwi|Kiwi fruit|Fruits|fruit|500|1|1
peach|Peach|Fruits|fruit|400|1|1
plum|Plum|Fruits|fruit|350|1|1
fig|Fresh fig|Fruits|fruit|450|1|1
blueberry|Blueberries|Fruits|fruit|900|1|1
dragon_fruit|Dragon fruit|Fruits|fruit|250|1|1
custard_apple|Custard apple|Fruits|fruit|180|1|1
lychee|Lychee|Fruits|fruit|200|1|1
gooseberry|Gooseberry|Fruits|fruit|140|1|1
buffalo_milk|Whole buffalo milk|Dairy|dairy|85|1|1.04
soy_milk|Unsweetened soy milk|Dairy alternatives|soyMilk|180|1|1.01
oat_milk|Oat milk, unsweetened|Dairy alternatives|dairy|250|1|1.02
greek_yogurt|Plain strained yogurt|Dairy|curd|260|1|1.04
mozzarella|Mozzarella cheese|Dairy|cheese|500|1|1.03
ricotta|Ricotta cheese|Dairy|cheese|600|1|1.03
white_fish|White fish fillet|Protein|fish|360|1|1
sardines|Sardines|Protein|fish|400|1|1
tuna|Tuna|Protein|fish|650|1|1
duck|Duck meat|Protein|meat|650|1|1
goat_meat|Goat meat|Protein|meat|800|1|1
lobster|Lobster meat|Protein|shellfish|1800|1|1
oyster|Oyster|Protein|shellfish|1200|1|1
almond_butter|Almond butter|Nuts & seeds|nut|1200|1|1.1
hazelnuts|Hazelnuts|Nuts & seeds|nut|1500|1|1
pecans|Pecans|Nuts & seeds|nut|1600|1|1
pine_nuts|Pine nuts|Nuts & seeds|nut|2500|1|1
hemp_seeds|Hemp seeds|Nuts & seeds|seed|1200|1|1
poppy_seeds|Poppy seeds|Nuts & seeds|seed|900|1|1
watermelon_seeds|Watermelon seeds|Nuts & seeds|seed|500|1|1
ajwain|Ajwain seeds|Spices|spice|600|1|1
black_cumin|Black cumin (kalonji)|Spices|spice|800|1|1
white_pepper|White pepper|Spices|spice|1200|1|1
paprika|Paprika|Spices|spice|700|1|1
smoked_paprika|Smoked paprika|Spices|spice|950|1|1
oregano|Dried oregano|Spices|spice|900|1|1
chilli_flakes|Chilli flakes|Spices|spice|600|1|1
onion_powder|Onion powder|Spices|spice|650|1|1
garlic_powder|Garlic powder|Spices|spice|650|1|1
cocoa_nibs|Cacao nibs|Sweets|chocolate|2200|1|1
maple_syrup|Maple syrup|Sweets|sweetener|1800|1|1.3
baking_powder|Baking powder|Pantry|salt|120|1|1
baking_soda|Baking soda|Pantry|salt|50|1|1
cornstarch|Cornstarch|Pantry|refinedFlour|100|1|1
gelatin|Gelatin|Pantry|gelatin|900|1|1
dark_raisins|Dark raisins|Fruits|fruit|300|1|1
black_tea|Black tea leaves|Pantry|spice|700|1|1
filter_coffee|Ground coffee|Pantry|vegetable|1300|1|1
nutritional_yeast|Nutritional yeast|Pantry|grain|1600|1|1
parmesan|Parmesan cheese|Dairy|cheese|1600|1|1.03
paneer_low_fat|Low-fat paneer|Dairy|paneer|420|1|1.02
sprouted_chickpeas|Sprouted chickpeas|Pulses|pulse|130|1|1
raw_mango|Raw green mango|Fruits|fruit|100|1|1
kokum|Kokum, dried|Pantry|fruit|900|1|1
kokum_syrup|Kokum extract|Pantry|fruit|450|1|1
black_salt|Black salt|Pantry|salt|55|1|1
white_peppercorn|White peppercorns|Spices|spice|1300|1|1
dry_ginger|Dry ginger powder|Spices|spice|900|1|1
chana_sattu|Roasted Bengal gram (sattu)|Pulses|pulse|105|1|1
chikki_jaggery|Peanut-jaggery chikki|Sweets|nut|240|1|1
rice_puffed|Puffed rice (murmura)|Grains|rice|90|1|1
flattened_rice|Flattened rice (poha), medium|Grains|rice|85|1|1
black_gram_dal|Urad dal, split and dehusked|Pulses|pulse|155|1|1
green_gram|Mung beans, whole|Pulses|pulse|140|1|1
moong_sprouts|Mung bean sprouts|Pulses|pulse|90|1|1
chana|Chickpeas, boiled equivalent|Pulses|pulse|140|1|1
green_chickpeas|Green chickpeas (hara chana)|Pulses|pulse|160|1|1
sweet_lime|Sweet lime (mosambi)|Fruits|citrus|80|1|1
plaintain|Plantain (raw banana)|Vegetables|root|50|1|1
yam_root|Yam root|Vegetables|root|65|1|1
arbi|Taro root|Vegetables|root|70|1|1
raw_cashew|Cashew nuts, raw|Nuts & seeds|nut|900|1|1
chironji|Chironji seeds|Nuts & seeds|seed|2400|1|1
dry_coconut|Desiccated coconut|Nuts & seeds|coconut|480|1|1
fresh_coconut|Fresh coconut|Nuts & seeds|coconut|180|1|1
date_syrup|Date syrup|Sweets|sweetener|450|1|1.3
rice_syrup|Rice syrup|Sweets|sweetener|350|1|1.3
millet_malt|Ragi malt powder|Grains|millet|110|1|1
soy_yogurt|Plain soy yogurt|Dairy alternatives|soy|220|1|1.03
vegan_butter|Plant-based butter|Dairy alternatives|oil|600|1|0.91
mustard_greens_raw|Mustard greens, raw|Vegetables|leafy|45|1|1
chard|Swiss chard|Vegetables|leafy|300|1|1
collard_greens|Collard greens|Vegetables|leafy|260|1|1
frozen_peas|Green peas, frozen|Vegetables|vegetable|110|1|1
frozen_corn|Sweet corn, frozen|Vegetables|vegetable|120|1|1
button_mushroom|Button mushrooms, sliced|Vegetables|vegetable|180|1|1
shiitake_mushroom|Shiitake mushrooms|Vegetables|vegetable|650|1|1
red_lentil|Masoor dal, split|Pulses|pulse|135|1|1
chickpea_flour_roasted|Roasted chickpea flour|Grains|pulse|110|1|1
wholemeal_bread|Wholemeal bread|Grains|grain|120|30|1
white_bread|White bread|Grains|refinedFlour|95|30|1
oat_flour|Oat flour|Grains|oats|220|1|1
buckwheat_flour|Buckwheat flour|Grains|grain|260|1|1
spelt_flour|Spelt flour|Grains|grain|280|1|1
chickpea_pasta|Chickpea pasta, dry|Grains|pulse|280|1|1
soy_sauce_low_sodium|Reduced-sodium soy sauce|Pantry|condiment|320|1|1.1
mustard_paste|Mustard paste|Condiments|seed|300|1|1.05
ginger_pickle|Ginger pickle|Condiments|vegetable|220|1|1
black_pepper_ground|Ground black pepper|Spices|spice|1200|1|1
coriander_seed|Coriander seeds|Spices|spice|450|1|1
cumin_powder|Cumin powder|Spices|spice|550|1|1
turmeric_fresh|Fresh turmeric root|Vegetables|vegetable|300|1|1
fresh_dill|Fresh dill|Herbs|herb|300|1|1
parsley|Fresh parsley|Herbs|herb|500|1|1
chives|Fresh chives|Herbs|herb|900|1|1
chocolate_chips|Dark chocolate chips|Sweets|chocolate|1500|1|1
vanilla_sugar|Vanilla sugar|Sweets|sweetener|500|1|1
orange_zest|Orange zest|Fruits|citrus|200|1|1
rose_water|Rose water|Pantry|vegetable|300|1|1
edible_camphor|Edible camphor|Pantry|spice|9000|1|1
ice_cream|Vanilla ice cream|Dairy|dairy|300|1|1.05
paneer_fresh|Fresh paneer|Dairy|paneer|380|1|1.02
chicken_minced|Chicken mince, raw|Protein|poultry|320|1|1
whitefish|White fish, raw|Protein|fish|360|1|1
scallops|Scallops|Protein|shellfish|1400|1|1
sesame_oil_roasted|Roasted sesame oil|Pantry|oil|500|1|0.92
sunflower_oil|Sunflower oil|Pantry|oil|160|1|0.92
groundnut_oil|Groundnut oil|Pantry|oil|220|1|0.92
mustard_oil_cold_pressed|Cold-pressed mustard oil|Pantry|oil|320|1|0.92
white_sugar|Granulated sugar|Pantry|sweetener|48|1|1
caster_sugar|Caster sugar|Pantry|sweetener|55|1|1
rock_sugar|Rock sugar (mishri)|Pantry|sweetener|100|1|1
chickpea|Chickpeas, dry|Pulses|pulse|140|1|1
garlic_clove|Garlic clove|Vegetables|vegetable|180|3|1
red_onion_small|Small red onion|Vegetables|vegetable|36|70|1
mustard_leaf|Mustard leaf|Vegetables|leafy|45|1|1
wild_rice|Wild rice|Grains|brownRice|650|1|1
basmati_brown_rice|Brown basmati rice|Grains|brownRice|160|1|1
finger_millet|Finger millet (ragi), whole|Grains|millet|90|1|1
pearl_millet|Pearl millet (bajra), whole|Grains|millet|65|1|1
sorghum|Sorghum (jowar), whole|Grains|millet|75|1|1
amaranth_grain|Amaranth grain|Grains|grain|200|1|1
sesame_paste|Sesame paste (tahini)|Nuts & seeds|seed|800|1|1.1
ghee_cow|Cow ghee|Dairy|ghee|700|1|0.91
chicken_leg|Chicken leg, raw|Protein|poultry|260|1|1
tilapia|Tilapia, raw|Protein|fish|400|1|1
shrimp|Shrimp, raw|Protein|shellfish|520|1|1
lobia|Black-eyed peas (lobia), dry|Pulses|bean|125|1|1
moong_whole|Whole green gram|Pulses|pulse|140|1|1
red_kidney_beans|Red kidney beans, dry|Pulses|bean|145|1|1
white_chickpeas|White chickpeas, dry|Pulses|pulse|140|1|1
mixed_vegetables|Mixed seasonal vegetables|Vegetables|vegetable|70|1|1
green_coriander|Coriander leaves, fresh|Herbs|herb|120|1|1
fresh_mint|Mint leaves, fresh|Herbs|herb|180|1|1
chilli_green|Green chilli, fresh|Vegetables|vegetable|100|8|1
red_chilli|Red chilli, dried|Spices|spice|600|1|1
black_mustard|Black mustard seeds|Spices|seed|220|1|1
bay_leaves|Dried bay leaves|Spices|spice|900|1|1
clove_powder|Ground cloves|Spices|spice|1600|1|1
fresh_curry_leaves|Fresh curry leaves|Herbs|herb|220|1|1
kokum_dried|Kokum rind, dried|Spices|fruit|900|1|1
vanilla_extract|Vanilla extract|Pantry|vegetable|2000|1|1
carob_powder|Carob powder|Sweets|chocolate|900|1|1
millet_flakes|Millet flakes|Grains|millet|140|1|1
roasted_peanuts|Roasted peanuts|Nuts & seeds|nut|200|1|1
roasted_gram|Roasted Bengal gram|Pulses|pulse|130|1|1
black_urad|Black urad dal|Pulses|pulse|145|1|1
rice_paper|Rice paper wrappers|Grains|rice|220|1|1
corn_tortilla|Corn tortilla|Grains|grain|160|1|1
whole_wheat_tortilla|Whole wheat tortilla|Grains|grain|180|1|1
feta|Feta cheese|Dairy|cheese|650|1|1.03
cream_cheese|Cream cheese|Dairy|cheese|550|1|1.03
soy_curd|Soy curd|Dairy alternatives|soy|220|1|1.03
chicken_breast|Chicken breast|Protein|poultry|300|1|1
fish_fillet|Fish fillet|Protein|fish|360|1|1
shrimp_small|Small shrimp|Protein|shellfish|500|1|1
roasted_coconut|Roasted coconut|Nuts & seeds|coconut|220|1|1
dry_mango_powder|Amchur (dry mango powder)|Spices|spice|650|1|1
white_sesame|White sesame seeds|Nuts & seeds|seed|300|1|1
red_lentils_split|Split red lentils|Pulses|pulse|135|1|1
green_gram_split|Split green gram|Pulses|pulse|145|1|1
black_peas|Black peas, dry|Pulses|bean|130|1|1
field_beans|Field beans (val), dry|Pulses|bean|140|1|1
spinach_baby|Baby spinach|Vegetables|leafy|110|1|1
fresh_coconut_milk|Fresh coconut milk|Dairy alternatives|coconutMilk|180|1|1.01
`
  .trim()
  .split('\n')
  .map((line) => {
    const [id, name, category, profile, price, gramsPerPiece, gramsPerMl] = line.split('|')
    return {
      id: id.replaceAll(' ', '_'),
      name,
      category,
      profile,
      price: Number(price),
      gramsPerPiece: Number(gramsPerPiece),
      gramsPerMl: Number(gramsPerMl),
    }
  })

const recipeRows = {
  breakfast: `
Kanda Poha|west|Maharashtrian|poha|poha|vegan
Indori Poha|west|Madhya Pradesh|poha|poha|vegan
Sabudana Khichdi|west|Maharashtrian|grain|tapioca_pearls|vegan
Vegetable Upma|south|Tamil|grain|semolina|vegan
Rava Idli|south|Karnataka|dosa|idli_rava|veg
Kanchipuram Idli|south|Tamil|dosa|idli_rava|vegan
Masala Dosa|south|Karnataka|dosa|potato|vegan
Mysore Masala Dosa|south|Karnataka|dosa|potato|vegan
Pesarattu|south|Andhra|dosa|green_moong|vegan
Adai Dosa|south|Tamil|dosa|chana_dal|vegan
Ragi Dosa|south|Karnataka|dosa|finger_millet|vegan
Appam with Vegetable Stew|south|Kerala|curry|mixed_vegetables|vegan
Idiyappam with Coconut Milk|south|Kerala|grain|rice_flour|vegan
Ven Pongal|south|Tamil|rice|moong_dal|veg
Akki Rotti|south|Karnataka|flatbread|rice_flour|vegan
Methi Thepla|west|Gujarati|flatbread|fenugreek_leaves|veg
Aloo Paratha|north|Punjabi|flatbread|potato|veg
Mooli Paratha|north|Punjabi|flatbread|radish|veg
Besan Chilla|north|North Indian|dosa|chickpea_flour|vegan
Moong Dal Chilla|north|North Indian|dosa|moong_dal|vegan
Egg Bhurji Pav|west|Mumbai street food|snack|eggs|eggetarian
Masala Omelette|north|North Indian|snack|eggs|eggetarian
Banana Oats Porridge|global|Continental|porridge|banana|veg
Student Peanut Butter Toast|global|Student quick meals|toast|peanut_butter|vegan
`,
  lunch: `
Bengali Khichuri|east|Bengali|rice|moong_dal|veg
Dal Tadka Rice|north|Punjabi|dal|toor_dal|vegan
Chole Chawal|north|Punjabi|curry|chickpeas|vegan
Rajma Chawal|north|Punjabi|curry|kidney_beans|vegan
Kadhi Chawal|west|Gujarati|curry|curd|veg
Lemon Rice|south|Tamil|rice|basmati_rice|vegan
Tamarind Rice (Puliyodarai)|south|Tamil|rice|basmati_rice|vegan
Curd Rice|south|Tamil|rice|curd|veg
Vegetable Pulao|north|North Indian|rice|mixed_vegetables|vegan
Paneer Biryani|south|Hyderabadi|rice|paneer|veg
Vegetable Biryani|south|Hyderabadi|rice|mixed_vegetables|vegan
Chicken Biryani|south|Hyderabadi|rice|chicken|non-veg
Egg Biryani|south|Hyderabadi|rice|eggs|eggetarian
Sambar Sadam|south|Tamil|rice|toor_dal|vegan
Bisibele Bath|south|Karnataka|rice|toor_dal|vegan
Gujarati Dal Dhokli|west|Gujarati|dal|toor_dal|veg
Maharashtrian Pithla Bhakri|west|Maharashtrian|flatbread|chickpea_flour|vegan
Litti Chokha|east|Bihari|flatbread|sattu|vegan
Vegetable Hakka Noodles|east|Indo-Chinese|stir_fry|whole_wheat_noodles|vegan
Chilli Paneer Rice|east|Indo-Chinese|stir_fry|paneer|veg
Egg Fried Rice|east|Indo-Chinese|rice|eggs|eggetarian
Student Masala Macaroni|global|Student quick meals|noodle|whole_wheat_pasta|veg
Chickpea Salad Bowl|west|Mumbai street food|salad|chickpeas|vegan
Mediterranean Vegetable Couscous|global|Continental|salad|quinoa|vegan
`,
  dinner: `
Palak Paneer|north|Punjabi|curry|paneer|veg
Paneer Butter Masala|north|Punjabi|curry|paneer|veg
Chana Masala|north|Punjabi|curry|chickpeas|vegan
Dal Makhani|north|Punjabi|dal|black_gram|veg
Punjabi Kadhi Pakora|north|Punjabi|curry|curd|veg
Kashmiri Dum Aloo|north|Kashmiri|curry|potato|veg
Aloo Gobi|north|Punjabi|curry|cauliflower|vegan
Baingan Bharta|north|Punjabi|curry|aubergine|vegan
Sarson Saag with Makki Roti|north|Punjabi|flatbread|mustard_greens|veg
Chicken Curry|north|North Indian|curry|chicken|non-veg
Kerala Fish Curry|south|Kerala|curry|fish|non-veg
Goan Prawn Curry|west|Goan|curry|prawns|non-veg
Bengali Shorshe Maach|east|Bengali|curry|fish|non-veg
Mutton Rogan Josh|north|Kashmiri|curry|mutton|non-veg
Egg Curry|east|Bengali|curry|eggs|eggetarian
Mixed Vegetable Korma|south|South Indian|curry|mixed_vegetables|veg
Avial|south|Kerala|curry|mixed_vegetables|vegan
Kerala Vegetable Stew|south|Kerala|curry|mixed_vegetables|vegan
Soya Chunk Curry|west|Maharashtrian|curry|soy_chunks|vegan
Tofu Tikka Masala|north|North Indian|curry|tofu|vegan
Indo-Chinese Chicken Stir Fry|east|Indo-Chinese|stir_fry|chicken|non-veg
Vegetable Fried Rice|east|Indo-Chinese|rice|mixed_vegetables|vegan
One-Pot Tomato Pasta|global|Continental|noodle|whole_wheat_pasta|veg
Jain-Friendly Vegetable Stew|south|Kerala|curry|mixed_vegetables|jain-friendly
`,
  snacks: `
Khaman Dhokla|west|Gujarati|snack|chickpea_flour|vegan
Khandvi|west|Gujarati|snack|chickpea_flour|veg
Batata Vada|west|Maharashtrian|snack|potato|vegan
Sabudana Vada|west|Maharashtrian|snack|tapioca_pearls|vegan
Onion Pakora|north|North Indian|snack|red_onion|vegan
Aloo Tikki|north|North Indian|snack|potato|vegan
Paneer Tikka|north|Punjabi|snack|paneer|veg
Hara Bhara Kabab|north|Punjabi|snack|spinach|vegan
Masala Corn|west|Mumbai street food|snack|sweet_corn|veg
Sprouts Chaat|west|Mumbai street food|salad|sprouted_mung|vegan
Pani Puri|west|Mumbai street food|snack|white_peas|vegan
Bhel Puri|west|Mumbai street food|snack|rice_puffed|vegan
Punjabi Samosa|north|Punjabi|snack|potato|vegan
Rajasthani Pyaaz Kachori|west|Rajasthani|snack|red_onion|vegan
Vegetable Momos|east|Indo-Chinese|dumpling|cabbage|vegan
Chicken Momos|east|Indo-Chinese|dumpling|chicken|non-veg
Chilli Paneer|east|Indo-Chinese|stir_fry|paneer|veg
Gobi Manchurian|east|Indo-Chinese|snack|cauliflower|vegan
Vegetable Spring Rolls|east|Indo-Chinese|snack|cabbage|vegan
Egg Kathi Roll|east|Bengali|flatbread|eggs|eggetarian
Paneer Frankie|west|Mumbai street food|flatbread|paneer|veg
Chicken Frankie|west|Mumbai street food|flatbread|chicken|non-veg
Peanut Sundal|south|Tamil|snack|peanuts|vegan
Student Mug Omelette|global|Student quick meals|snack|eggs|eggetarian
`,
  sweets: `
Gajar Halwa|north|Punjabi|sweet|carrot|veg
Moong Dal Halwa|north|Rajasthani|sweet|moong_dal|veg
Suji Halwa|north|North Indian|sweet|semolina|veg
Besan Ladoo|north|North Indian|sweet|chickpea_flour|veg
Motichoor Ladoo|north|Rajasthani|sweet|chickpea_flour|veg
Rice Kheer|north|North Indian|sweet|basmati_rice|veg
Semiya Payasam|south|Kerala|sweet|vermicelli|veg
Chakkara Pongal|south|Tamil|sweet|moong_dal|veg
Sandesh|east|Bengali|sweet|paneer|veg
Rasgulla|east|Bengali|sweet|paneer|veg
Mishti Doi|east|Bengali|sweet|curd|veg
Puran Poli|west|Maharashtrian|sweet|chana_dal|veg
Shrikhand|west|Gujarati|sweet|curd|veg
Ukadiche Modak|west|Maharashtrian|sweet|rice_flour|veg
Til Ladoo|west|Maharashtrian|sweet|sesame_seeds|vegan
Coconut Barfi|south|South Indian|sweet|fresh_coconut|veg
Mango Kulfi|north|North Indian|sweet|mango|veg
Ragi Malt Pudding|south|Karnataka|sweet|finger_millet|vegan
Banana Sheera|west|Maharashtrian|sweet|banana|veg
Gulab Jamun|north|North Indian|sweet|khoya|veg
Atta Halwa|north|Punjabi|sweet|whole_wheat_flour|veg
Saffron Phirni|north|Punjabi|sweet|rice_flour|veg
Chocolate Peanut Chikki|global|Student quick meals|sweet|peanuts|vegan
Jain-Friendly Coconut Ladoo|south|South Indian|sweet|fresh_coconut|jain-friendly
`,
}

export const ingredients = ingredientRows

export const recipes = Object.entries(recipeRows).flatMap(([mealType, rows]) => rows
  .trim()
  .split('\n')
  .map((line) => {
    const [name, region, cuisine, method, mainIngredient, dietType] = line.split('|')
    return { name, region, cuisine, mealType, method, mainIngredient, dietType }
  }))

export const ingredientNutrition = (ingredient) => nutritionProfiles[ingredient.profile]
