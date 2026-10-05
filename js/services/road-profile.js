/* Profil BRouter « vélo de route » : dérivé de fastbike-verylowtraffic (BRouter, MIT).
   Différences : pistes, sentiers et revêtements non asphaltés quasi interdits,
   trafic évité plus ou moins fortement selon le niveau choisi.
   Le texte est envoyé au serveur (POST /brouter/profile) qui renvoie un identifiant temporaire. */

/**
 * @param {{traffic:number}} opts multiplicateur de pénalité de trafic (0 = ignoré)
 */
export function roadProfile({ traffic = 1 } = {}) {
  return `---context:global
assign validForBikes = true
assign consider_traffic = ${traffic > 0 ? 'true' : 'false'}
assign traffic_factor = ${traffic}
assign downhillcost = 60
assign downhillcutoff = 1.5
assign uphillcost = 0
assign uphillcutoff = 1.5
assign totalMass = 85
assign maxSpeed = 50
assign S_C_x = 0.3
assign C_r = 0.005
assign bikerPower = 180
assign turnInstructionMode = 1
assign turnInstructionCatchingRange = 40
assign turnInstructionRoundabouts = true
assign considerTurnRestrictions = true

---context:way
assign any_cycleroute or route_bicycle_icn=yes or route_bicycle_ncn=yes or route_bicycle_rcn=yes route_bicycle_lcn=yes
assign nodeaccessgranted or any_cycleroute lcn=yes

assign ispaved or surface=paved or surface=asphalt or surface=concrete surface=paving_stones
assign isunpaved not or surface= or ispaved surface=fine_gravel

assign turncost = if junction=roundabout then 0 else 90
assign initialclassifier = if route=ferry then 1 else 0
assign initialcost switch route=ferry 10000 0

assign defaultaccess
       switch access=
              ( if motorroad=yes then false else if highway=motorway|motorway_link then false else true )
              switch or access=private access=no false true

assign bikeaccess =
       switch bicycle=
              switch bicycle_road=yes true
                 switch vehicle= ( if highway=footway then false else defaultaccess ) not vehicle=private|no
              not or bicycle=private or bicycle=no bicycle=dismount

assign accesspenalty switch bikeaccess 0 10000

assign badoneway =
       if reversedirection=yes then
         if oneway:bicycle=yes then true
         else if oneway= then junction=roundabout
         else oneway=yes|true|1
       else oneway=-1

assign onewaypenalty =
       if badoneway then ( if oneway:bicycle=no then 0 else if cycleway=opposite|opposite_lane|opposite_track then 0 else 10000 )
       else 0

/* Pénalité de trafic par classe (OSM estimated_traffic_class, mesure réelle du trafic,
   pas la taille de la commune) : relevée aux deux échelons les plus chargés — quasi
   jamais atteints par une rue de village, presque toujours par un centre de grande
   ville (type Besançon) — pour s'en écarter plus franchement sans toucher aux petites
   routes traversant un village, qui restent en classe basse. */
assign trafficpenalty0 =
  if consider_traffic then
  (
    if highway=primary|primary_link then
    (
      if estimated_traffic_class=1|2 then 0.3
      else if estimated_traffic_class=3 then 0.6
      else if estimated_traffic_class=4 then 1.4
      else if estimated_traffic_class=5 then 2.2
      else if estimated_traffic_class=6|7 then 3.2
      else 0.6
    )
    else if highway=secondary|secondary_link then
    (
      if estimated_traffic_class=3 then 0.3
      else if estimated_traffic_class=4 then 0.9
      else if estimated_traffic_class=5 then 1.6
      else if estimated_traffic_class=6|7 then 2.4
      else 0.1
    )
    else if highway=tertiary|tertiary_link then
    (
      if estimated_traffic_class=3 then 0.2
      else if estimated_traffic_class=4 then 0.6
      else if estimated_traffic_class=5|6|7 then 1.4
      else 0
    )
    else 0
  )
  else 0

assign trafficpenalty multiply trafficpenalty0 traffic_factor

assign isresidentialorliving or highway=residential|living_street living_street=yes

assign costfactor
  switch and highway= not route=ferry 10000
  switch or highway=proposed highway=abandoned 10000
  min 9999
  add max onewaypenalty accesspenalty
  add trafficpenalty
  switch or highway=motorway highway=motorway_link 10000
  switch or highway=trunk highway=trunk_link 10
  switch or highway=primary highway=primary_link 1.2
  switch or highway=secondary highway=secondary_link 1.1
  switch or highway=tertiary highway=tertiary_link 1.0
  switch highway=unclassified switch isunpaved 40 1.05
  switch highway=pedestrian 20
  switch highway=steps 10000
  switch route=ferry 10000
  switch highway=bridleway 60
  switch highway=cycleway switch isunpaved 40 1.2
  switch isresidentialorliving switch isunpaved 40 1.3
  switch highway=service switch isunpaved 40 1.5
  switch or highway=track or highway=road or highway=path highway=footway
   switch ispaved
     switch or bicycle=designated bicycle_road=yes 1.3 3
     switch and highway=track tracktype=grade1 6 60
  20

assign priorityclassifier =
  if highway=motorway then 30
  else if highway=motorway_link then 29
  else if highway=trunk then 28
  else if highway=trunk_link then 27
  else if highway=primary then 26
  else if highway=primary_link then 25
  else if highway=secondary then 24
  else if highway=secondary_link then 23
  else if highway=tertiary then 22
  else if highway=tertiary_link then 21
  else if highway=unclassified then 20
  else if isresidentialorliving then 6
  else if highway=service then 6
  else if highway=cycleway then 6
  else if highway=track then 4
  else if highway=bridleway|road|path|footway then 4
  else if highway=steps then 2
  else if highway=pedestrian then 2
  else 0

assign isbadoneway = not equal onewaypenalty 0
assign isgoodoneway = if reversedirection=yes then oneway=-1 else if oneway= then junction=roundabout else oneway=yes|true|1
assign isroundabout = junction=roundabout
assign islinktype = highway=motorway_link|trunk_link|primary_link|secondary_link|tertiary_link
assign isgoodforcars = if greater priorityclassifier 6 then true
                  else if or isresidentialorliving highway=service then true
                  else false
assign classifiermask add isbadoneway add multiply isgoodoneway 2 add multiply isroundabout 4 add multiply islinktype 8 multiply isgoodforcars 16

---context:node
assign defaultaccess switch access= 1 switch or access=private access=no 0 1
assign bikeaccess
       or nodeaccessgranted=yes
          switch bicycle=
                 switch vehicle= defaultaccess switch or vehicle=private vehicle=no 0 1
                 switch or bicycle=private or bicycle=no bicycle=dismount 0 1
assign initialcost switch bikeaccess 0 1000000
`;
}
