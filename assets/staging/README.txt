STAGING FOLDER FOR NEW OR CLEANED 3D ASSETS (Meshy and others)

Who does what
- The Librarian: geometry and material corrections, and the checks below, before delivery.
- The Professor: integration (scale, placement, interaction) and a headless render after delivery.
- The Director: testing on the Quest.

Naming
- <asset>_v<N>.glb  (example: townbook_v2.glb)
- A one-line sidecar next to it: <asset>_v<N>.txt

Sidecar must say
- bounding box X x Y x Z, in the units the file really uses
- triangle count
- watertight: yes or no
- texture format
- what was changed from the previous version

Checks before delivery
- dimensions, pivot, orientation
- textures and UVs kept
- holes and flipped faces
- the loader scales each prop to a target height and puts its base at y = 0, so give the target height in the sidecar

Rules
- Only the Round 8 folder is touched. Round 7 stays as it is.
- A new model and any code change for it go into the same build.
- Nothing here is deleted. Superseded files are moved to staging/old/.
